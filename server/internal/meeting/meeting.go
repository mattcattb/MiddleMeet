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

type Participant struct {
	Name     string       `json:"name"`
	Location geo.Location `json:"location"`
}

type ParticipantEstimate struct {
	ParticipantName string       `json:"participantName"`
	Location        geo.Location `json:"location"`
	DistanceMeters  int          `json:"distanceMeters"`
	DurationSeconds int          `json:"durationSeconds"`
}

type ParticipantRoute struct {
	ParticipantName string        `json:"participantName"`
	Route           RouteEstimate `json:"route"`
}

type MeetingRoutes struct {
	Destination geo.Location       `json:"destination"`
	Routes      []ParticipantRoute `json:"routes"`
}

type RouteEstimator interface {
	EstimateRoute(from geo.Location, to geo.Location) (RouteEstimate, error)
	EstimateRouteMatrix(origins []geo.Location, destinations []geo.Location) (RouteMatrix, error)
}

type RouteMatrix struct {
	DurationSeconds [][]int `json:"durationSeconds"`
	DistanceMeters  [][]int `json:"distanceMeters,omitempty"`
}

type MeetingEstimate struct {
	Destination geo.Location `json:"destination"`

	Participants []ParticipantEstimate `json:"participants"`

	AverageDurationSeconds int `json:"averageDurationSeconds"`
	TotalDurationSeconds   int `json:"totalDurationSeconds"`
	DurationSpreadSeconds  int `json:"durationSpreadSeconds"`
	MaxDurationSeconds     int `json:"maxDurationSeconds"`
}
