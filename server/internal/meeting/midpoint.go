package meeting

import (
	"fmt"
	"math"
	"middle-meetup-server/internal/geo"
	"sort"
)

type MidpointResponse struct {
	Midpoint   DestinationCandidate   `json:"midpoint"`
	Candidates []DestinationCandidate `json:"candidates"`
	Area       *MeetingArea           `json:"area,omitempty"`
}

func (p *Planner) FindMidpoint(participants []Participant, constraints MeetingConstraints) (MidpointResponse, error) {
	if len(participants) < 2 {
		return MidpointResponse{}, fmt.Errorf("midpoint requires at least two participants")
	}

	constraints = normalizeConstraints(constraints)

	var area *MeetingArea
	var sharedBox *geo.BBox
	if constraints.MaxDurationSeconds > 0 {
		meetingArea, err := p.BuildMeetingArea(participants, constraints)
		if err != nil {
			return MidpointResponse{}, err
		}

		if box, ok := sharedAreaBBox(meetingArea.Participants); ok {
			meetingArea.BBox = &box
			sharedBox = &box
		}
		area = &meetingArea
	}

	locations := midpointCandidateLocations(participants, sharedBox, area)
	candidates, err := p.rankMidpointCandidates(participants, locations, constraints.SortBy)
	if err != nil {
		return MidpointResponse{}, err
	}

	if constraints.MaxDurationSeconds > 0 {
		filtered := candidates[:0]
		for _, candidate := range candidates {
			if candidate.Estimate.MaxDurationSeconds <= constraints.MaxDurationSeconds {
				filtered = append(filtered, candidate)
			}
		}
		candidates = filtered
	}

	if len(candidates) == 0 {
		return MidpointResponse{}, fmt.Errorf("no midpoint candidates matched the meeting constraints")
	}

	const limit = 10
	if len(candidates) > limit {
		candidates = candidates[:limit]
	}

	return MidpointResponse{
		Midpoint:   candidates[0],
		Candidates: candidates,
		Area:       area,
	}, nil
}

func midpointCandidateLocations(participants []Participant, sharedBox *geo.BBox, area *MeetingArea) []geo.Location {
	if sharedBox == nil {
		return []geo.Location{midpointLocation(participantCenter(participants), "Midpoint")}
	}

	const steps = 5
	locations := make([]geo.Location, 0, steps*steps+1)
	seen := make(map[string]bool)
	add := func(coord geo.Coord, name string) {
		key := fmt.Sprintf("%.6f,%.6f", coord.Lat, coord.Lng)
		if seen[key] {
			return
		}
		if area != nil && !coordInParticipantAreas(coord, area.Participants) {
			return
		}
		seen[key] = true
		locations = append(locations, midpointLocation(coord, name))
	}

	add(bboxCenter(*sharedBox), "Midpoint")

	latStep := 0.0
	lngStep := 0.0
	if steps > 1 {
		latStep = (sharedBox.MaxLat - sharedBox.MinLat) / float64(steps-1)
		lngStep = (sharedBox.MaxLng - sharedBox.MinLng) / float64(steps-1)
	}

	for latIndex := 0; latIndex < steps; latIndex++ {
		for lngIndex := 0; lngIndex < steps; lngIndex++ {
			add(geo.Coord{
				Lat: sharedBox.MinLat + float64(latIndex)*latStep,
				Lng: sharedBox.MinLng + float64(lngIndex)*lngStep,
			}, "Midpoint option")
		}
	}

	if len(locations) == 0 {
		locations = append(locations, midpointLocation(participantCenter(participants), "Midpoint"))
	}

	return locations
}

func (p *Planner) rankMidpointCandidates(participants []Participant, locations []geo.Location, sortBy SortBy) ([]DestinationCandidate, error) {
	origins := make([]geo.Location, 0, len(participants))
	for _, participant := range participants {
		origins = append(origins, participant.Location)
	}

	matrix, err := p.routes.EstimateRouteMatrix(origins, locations)
	if err != nil {
		return nil, err
	}

	candidates := make([]DestinationCandidate, 0, len(locations))
	for destinationIndex, location := range locations {
		estimate, err := meetingEstimateFromMatrix(participants, location, matrix, destinationIndex)
		if err != nil {
			return nil, err
		}

		candidates = append(candidates, DestinationCandidate{
			Location: location,
			Estimate: estimate,
			Score:    scoreEstimate(estimate, sortBy),
		})
	}

	sort.Slice(candidates, func(i int, j int) bool {
		if candidates[i].Score == candidates[j].Score {
			return candidates[i].Estimate.MaxDurationSeconds < candidates[j].Estimate.MaxDurationSeconds
		}
		return candidates[i].Score < candidates[j].Score
	})

	return candidates, nil
}

func meetingEstimateFromMatrix(participants []Participant, destination geo.Location, matrix RouteMatrix, destinationIndex int) (MeetingEstimate, error) {
	estimates := make([]ParticipantEstimate, 0, len(participants))
	totalDuration := 0
	maxDuration := 0
	minDuration := 0

	for participantIndex, participant := range participants {
		if participantIndex >= len(matrix.DurationSeconds) || destinationIndex >= len(matrix.DurationSeconds[participantIndex]) {
			return MeetingEstimate{}, fmt.Errorf("route matrix missing duration for participant %d destination %d", participantIndex, destinationIndex)
		}

		duration := matrix.DurationSeconds[participantIndex][destinationIndex]
		distance := 0
		if participantIndex < len(matrix.DistanceMeters) && destinationIndex < len(matrix.DistanceMeters[participantIndex]) {
			distance = matrix.DistanceMeters[participantIndex][destinationIndex]
		}

		if participantIndex == 0 || duration < minDuration {
			minDuration = duration
		}
		if duration > maxDuration {
			maxDuration = duration
		}

		totalDuration += duration
		estimates = append(estimates, ParticipantEstimate{
			ParticipantName: participant.Name,
			Location:        participant.Location,
			DistanceMeters:  distance,
			DurationSeconds: duration,
		})
	}

	return MeetingEstimate{
		Destination:            destination,
		Participants:           estimates,
		AverageDurationSeconds: totalDuration / len(estimates),
		TotalDurationSeconds:   totalDuration,
		DurationSpreadSeconds:  maxDuration - minDuration,
		MaxDurationSeconds:     maxDuration,
	}, nil
}

func sharedAreaBBox(areas []ParticipantArea) (geo.BBox, bool) {
	if len(areas) == 0 {
		return geo.BBox{}, false
	}

	box, ok := polygonBBox(areas[0].Area)
	if !ok {
		return geo.BBox{}, false
	}

	for _, area := range areas[1:] {
		next, ok := polygonBBox(area.Area)
		if !ok {
			return geo.BBox{}, false
		}

		box.MinLat = math.Max(box.MinLat, next.MinLat)
		box.MinLng = math.Max(box.MinLng, next.MinLng)
		box.MaxLat = math.Min(box.MaxLat, next.MaxLat)
		box.MaxLng = math.Min(box.MaxLng, next.MaxLng)

		if box.MinLat > box.MaxLat || box.MinLng > box.MaxLng {
			return geo.BBox{}, false
		}
	}

	return box, true
}

func polygonBBox(polygon geo.Polygon) (geo.BBox, bool) {
	var box geo.BBox
	hasPoint := false

	for _, ring := range polygon.Coordinates {
		for _, point := range ring {
			if len(point) < 2 {
				continue
			}

			lng := point[0]
			lat := point[1]
			if !hasPoint {
				box = geo.BBox{
					MinLat: lat,
					MinLng: lng,
					MaxLat: lat,
					MaxLng: lng,
				}
				hasPoint = true
				continue
			}

			box.MinLat = math.Min(box.MinLat, lat)
			box.MinLng = math.Min(box.MinLng, lng)
			box.MaxLat = math.Max(box.MaxLat, lat)
			box.MaxLng = math.Max(box.MaxLng, lng)
		}
	}

	return box, hasPoint
}

func bboxCenter(box geo.BBox) geo.Coord {
	return geo.Coord{
		Lat: (box.MinLat + box.MaxLat) / 2,
		Lng: (box.MinLng + box.MaxLng) / 2,
	}
}

func midpointLocation(coord geo.Coord, name string) geo.Location {
	address := fmt.Sprintf("%.5f, %.5f", coord.Lat, coord.Lng)
	return geo.Location{
		Name:    name,
		Address: address,
		Coord:   coord,
	}
}

func coordInParticipantAreas(coord geo.Coord, areas []ParticipantArea) bool {
	for _, area := range areas {
		if !coordInPolygon(coord, area.Area) {
			return false
		}
	}
	return true
}

func coordInPolygon(coord geo.Coord, polygon geo.Polygon) bool {
	if len(polygon.Coordinates) == 0 {
		return false
	}

	if !coordInRing(coord, polygon.Coordinates[0]) {
		return false
	}

	for _, hole := range polygon.Coordinates[1:] {
		if coordInRing(coord, hole) {
			return false
		}
	}

	return true
}

func coordInRing(coord geo.Coord, ring [][]float64) bool {
	if len(ring) < 3 {
		return false
	}

	inside := false
	x := coord.Lng
	y := coord.Lat

	for i, j := 0, len(ring)-1; i < len(ring); j, i = i, i+1 {
		if len(ring[i]) < 2 || len(ring[j]) < 2 {
			continue
		}

		xi := ring[i][0]
		yi := ring[i][1]
		xj := ring[j][0]
		yj := ring[j][1]

		intersects := (yi > y) != (yj > y)
		if intersects && x < (xj-xi)*(y-yi)/(yj-yi)+xi {
			inside = !inside
		}
	}

	return inside
}
