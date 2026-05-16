package meeting

import (
	"fmt"
	"middle-meetup-server/internal/geo"
	"sort"
	"strings"
)

func (p *Planner) SearchDestinations(req DestinationSearchRequest) (DestinationSearchResponse, error) {
	if len(req.Participants) == 0 {
		return DestinationSearchResponse{}, fmt.Errorf("destination search requires at least one participant")
	}

	query := strings.TrimSpace(req.Query)
	if query == "" {
		return DestinationSearchResponse{}, fmt.Errorf("destination search query is required")
	}

	constraints := normalizeConstraints(req.Constraints)
	limit := req.Limit
	if limit <= 0 {
		limit = 10
	}

	center := participantCenter(req.Participants)
	locations, err := p.places.SearchPlaces(query, center, constraints.RadiusMeters)
	if err != nil {
		return DestinationSearchResponse{}, err
	}

	candidates := make([]DestinationCandidate, 0, len(locations))
	for _, location := range locations {
		estimate, err := p.EstimateMeeting(req.Participants, location)
		if err != nil {
			return DestinationSearchResponse{}, err
		}

		if constraints.MaxDurationSeconds > 0 && estimate.MaxDurationSeconds > constraints.MaxDurationSeconds {
			continue
		}

		candidates = append(candidates, DestinationCandidate{
			Location: location,
			Estimate: estimate,
			Score:    scoreEstimate(estimate, constraints.SortBy),
		})
	}

	sort.Slice(candidates, func(i int, j int) bool {
		return candidates[i].Score < candidates[j].Score
	})

	if len(candidates) > limit {
		candidates = candidates[:limit]
	}

	return DestinationSearchResponse{
		Query:        query,
		Destinations: candidates,
	}, nil
}

func normalizeConstraints(constraints MeetingConstraints) MeetingConstraints {
	if constraints.RadiusMeters <= 0 {
		constraints.RadiusMeters = 10000
	}

	if constraints.SortBy == "" {
		constraints.SortBy = SortByFairest
	}

	return constraints
}

func participantCenter(participants []Participant) geo.Coord {
	var lat float64
	var lng float64

	for _, participant := range participants {
		lat += participant.Location.Coord.Lat
		lng += participant.Location.Coord.Lng
	}

	count := float64(len(participants))
	return geo.Coord{
		Lat: lat / count,
		Lng: lng / count,
	}
}

func scoreEstimate(estimate MeetingEstimate, sortBy SortBy) int {
	switch sortBy {
	case SortByFastest:
		return estimate.AverageDurationSeconds
	case SortByLowestMaxTime:
		return estimate.MaxDurationSeconds
	case SortByFairest:
		fallthrough
	default:
		return estimate.AverageDurationSeconds + estimate.DurationSpreadSeconds
	}
}
