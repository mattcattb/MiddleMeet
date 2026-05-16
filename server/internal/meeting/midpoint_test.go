package meeting

import (
	"math"
	"middle-meetup-server/internal/geo"
	"testing"
)

type fakePlannerMaps struct{}

func (fakePlannerMaps) EstimateRoute(from geo.Location, to geo.Location) (RouteEstimate, error) {
	return RouteEstimate{
		From:            from,
		To:              to,
		DistanceMeters:  routeCost(from, to),
		DurationSeconds: routeCost(from, to),
	}, nil
}

func (fakePlannerMaps) EstimateRouteMatrix(origins []geo.Location, destinations []geo.Location) (RouteMatrix, error) {
	durations := make([][]int, 0, len(origins))
	distances := make([][]int, 0, len(origins))

	for _, origin := range origins {
		durationRow := make([]int, 0, len(destinations))
		distanceRow := make([]int, 0, len(destinations))
		for _, destination := range destinations {
			cost := routeCost(origin, destination)
			durationRow = append(durationRow, cost)
			distanceRow = append(distanceRow, cost)
		}
		durations = append(durations, durationRow)
		distances = append(distances, distanceRow)
	}

	return RouteMatrix{
		DurationSeconds: durations,
		DistanceMeters:  distances,
	}, nil
}

func (fakePlannerMaps) BuildIsochrone(origin geo.Location, maxDurationSeconds int) (geo.Polygon, error) {
	switch origin.Name {
	case "A":
		return squarePolygon(0, 0, 10, 10), nil
	case "B":
		return squarePolygon(4, 4, 8, 8), nil
	default:
		return squarePolygon(-1, -1, 1, 1), nil
	}
}

func (fakePlannerMaps) SearchPlaces(query string, near geo.Coord, radiusMeters int) ([]geo.Location, error) {
	return nil, nil
}

func TestFindMidpointUsesParticipantCenterWithoutIsochrones(t *testing.T) {
	planner := NewPlanner(fakePlannerMaps{}, fakePlannerMaps{}, fakePlannerMaps{})
	participants := []Participant{
		{Name: "A", Location: testLocation("A", 0, 0)},
		{Name: "B", Location: testLocation("B", 0, 10)},
	}

	resp, err := planner.FindMidpoint(participants, MeetingConstraints{})
	if err != nil {
		t.Fatal(err)
	}

	got := resp.Midpoint.Location.Coord
	if got.Lat != 0 || got.Lng != 5 {
		t.Fatalf("midpoint coord = %+v, want lat=0 lng=5", got)
	}
}

func TestFindMidpointSamplesSharedIsochroneArea(t *testing.T) {
	planner := NewPlanner(fakePlannerMaps{}, fakePlannerMaps{}, fakePlannerMaps{})
	participants := []Participant{
		{Name: "A", Location: testLocation("A", 0, 0)},
		{Name: "B", Location: testLocation("B", 8, 8)},
	}

	resp, err := planner.FindMidpoint(participants, MeetingConstraints{
		MaxDurationSeconds: 20000,
	})
	if err != nil {
		t.Fatal(err)
	}

	if resp.Area == nil || resp.Area.BBox == nil {
		t.Fatal("expected midpoint response to include the sampled shared area bounds")
	}

	got := resp.Midpoint.Location.Coord
	if got.Lat < 4 || got.Lat > 8 || got.Lng < 4 || got.Lng > 8 {
		t.Fatalf("midpoint coord = %+v, want inside shared bbox 4..8", got)
	}
}

func routeCost(from geo.Location, to geo.Location) int {
	latDelta := math.Abs(from.Coord.Lat - to.Coord.Lat)
	lngDelta := math.Abs(from.Coord.Lng - to.Coord.Lng)
	return int((latDelta + lngDelta) * 1000)
}

func squarePolygon(minLat float64, minLng float64, maxLat float64, maxLng float64) geo.Polygon {
	return geo.Polygon{
		Type: "Polygon",
		Coordinates: [][][]float64{{
			{minLng, minLat},
			{maxLng, minLat},
			{maxLng, maxLat},
			{minLng, maxLat},
			{minLng, minLat},
		}},
	}
}

func testLocation(name string, lat float64, lng float64) geo.Location {
	return geo.Location{
		Name:    name,
		Address: name,
		Coord: geo.Coord{
			Lat: lat,
			Lng: lng,
		},
	}
}
