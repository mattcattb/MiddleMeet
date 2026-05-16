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

type AreaEstimator interface {
	BuildIsochrone(origin geo.Location, maxDurationSeconds int) (geo.Polygon, error)
}

type PlaceFinder interface {
	SearchPlaces(query string, near geo.Coord, radiusMeters int) ([]geo.Location, error)
}

type RouteMatrix struct {
	DurationSeconds [][]int `json:"durationSeconds"`
	DistanceMeters  [][]int `json:"distanceMeters,omitempty"`
}

type SortBy string

const (
	SortByFairest       SortBy = "fairest"
	SortByFastest       SortBy = "fastest"
	SortByLowestMaxTime SortBy = "lowestMaxTime"
)

type MeetingConstraints struct {
	MaxDurationSeconds int    `json:"maxDurationSeconds"`
	RadiusMeters       int    `json:"radiusMeters"`
	SortBy             SortBy `json:"sortBy"`
}

type MeetingEstimate struct {
	Destination geo.Location `json:"destination"`

	Participants []ParticipantEstimate `json:"participants"`

	AverageDurationSeconds int `json:"averageDurationSeconds"`
	TotalDurationSeconds   int `json:"totalDurationSeconds"`
	DurationSpreadSeconds  int `json:"durationSpreadSeconds"`
	MaxDurationSeconds     int `json:"maxDurationSeconds"`
}

type ParticipantArea struct {
	ParticipantName string      `json:"participantName"`
	Area            geo.Polygon `json:"area"`
}

type MeetingArea struct {
	Participants []ParticipantArea `json:"participants"`
	Intersection *geo.Polygon      `json:"intersection,omitempty"`
	BBox         *geo.BBox         `json:"bbox,omitempty"`
}

type DestinationSearchRequest struct {
	Participants []Participant      `json:"participants"`
	Query        string             `json:"query"`
	Constraints  MeetingConstraints `json:"constraints"`
	Limit        int                `json:"limit"`
}

type DestinationCandidate struct {
	Location geo.Location    `json:"location"`
	Estimate MeetingEstimate `json:"estimate"`
	Score    int             `json:"score"`
}

type DestinationSearchResponse struct {
	Query        string                 `json:"query"`
	Area         *MeetingArea           `json:"area,omitempty"`
	Destinations []DestinationCandidate `json:"destinations"`
}
