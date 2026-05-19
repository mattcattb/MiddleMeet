package meeting

import (
	"middle-meetup-server/internal/geo"
	"testing"
)

func TestEstimateMeetingAggregatesRouteMatrix(t *testing.T) {
	planner := NewPlanner(staticRouteMatrix{
		matrix: RouteMatrix{
			DurationSeconds: [][]int{{600}, {1200}},
			DistanceMeters:  [][]int{{5000}, {11000}},
		},
	}, nil, nil)

	destination := geo.Location{Name: "Cafe", Coord: geo.Coord{Lat: 10, Lng: 20}}
	resp, err := planner.EstimateMeeting([]Participant{
		{Name: "A", Location: geo.Location{Name: "A"}},
		{Name: "B", Location: geo.Location{Name: "B"}},
	}, destination)
	if err != nil {
		t.Fatal(err)
	}

	if resp.AverageDurationSeconds != 900 {
		t.Fatalf("average duration = %d, want 900", resp.AverageDurationSeconds)
	}
	if resp.TotalDurationSeconds != 1800 {
		t.Fatalf("total duration = %d, want 1800", resp.TotalDurationSeconds)
	}
	if resp.DurationSpreadSeconds != 600 {
		t.Fatalf("duration spread = %d, want 600", resp.DurationSpreadSeconds)
	}
	if resp.MaxDurationSeconds != 1200 {
		t.Fatalf("max duration = %d, want 1200", resp.MaxDurationSeconds)
	}
	if len(resp.Participants) != 2 {
		t.Fatalf("participants = %d, want 2", len(resp.Participants))
	}
}

type staticRouteMatrix struct {
	matrix RouteMatrix
}

func (s staticRouteMatrix) EstimateRoute(geo.Location, geo.Location) (RouteEstimate, error) {
	return RouteEstimate{}, nil
}

func (s staticRouteMatrix) EstimateRouteMatrix([]geo.Location, []geo.Location) (RouteMatrix, error) {
	return s.matrix, nil
}
