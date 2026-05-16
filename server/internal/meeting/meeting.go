package meeting

import (
	"middle-meetup-server/internal/geo"
)

type RouteEstimate struct {
	From            geo.Location      `json:"from"`
	To              geo.Location      `json:"to"`
	DistanceMeters  int               `json:"distanceMeters"`
	DurationSeconds int               `json:"durationSeconds"`
	Geometry        geo.RouteGeometry `json:"geometry"`
	Steps           []geo.RouteStep   `json:"steps,omitempty"`
	BBox            []float64         `json:"bbox,omitempty"`
}

type RouteEstimator interface {
	EstimateRoute(from geo.Location, to geo.Location) (RouteEstimate, error)
}

type RouteMatrix struct {
	DurationSeconds [][]int `json:"durationSeconds"`
	DistanceMeters  [][]int `json:"distanceMeters,omitempty"`
}

type ReachableArea struct{}

type MeetingOption struct {
	Destination geo.Location  `json:"destination"`
	FromA       RouteEstimate `json:"fromA"`
	FromB       RouteEstimate `json:"fromB"`

	TotalDurationSeconds      int `json:"totalDurationSeconds"`
	DurationDifferenceSeconds int `json:"durationDifferenceSeconds"`
	MaxDurationSeconds        int `json:"maxDurationSeconds"`
}

func abs(x int) int {

	if x < 0 {
		return -x
	}
	return x

}
