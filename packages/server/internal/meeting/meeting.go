package meeting

import (
	"map-go-server/internal/geo"
)

type RouteEstimate struct {
	From            geo.Location `json:"from"`
	To              geo.Location `json:"to"`
	DistanceMeters  int          `json:"distanceMeters"`
	DurationSeconds int          `json:"durationSeconds"`
}

type RouteEstimator interface {
	EstimateRoute(from geo.Location, to geo.Location) (RouteEstimate, error)
}

type LocationSearcher interface {
	SearchLocations(query string, near geo.Coord, radiusMeters int) ([]geo.Location, error)
}

type Service struct {
	routes RouteEstimator
}

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

func NewService(routes RouteEstimator) *Service {
	return &Service{
		routes: routes,
	}
}

func (s *Service) CompareDestinations(locationA geo.Location, locationB geo.Location, potentialLocations []geo.Location) ([]MeetingOption, error) {
	// go through and uhhh uhh uhh

	meetingOptions := []MeetingOption{}

	for _, loc := range potentialLocations {

		routeFromA, err := s.routes.EstimateRoute(locationA, loc)
		if err != nil {
			return meetingOptions, err
		}
		routeFromB, err := s.routes.EstimateRoute(locationB, loc)

		if err != nil {
			return meetingOptions, err
		}

		option := MeetingOption{
			Destination:               loc,
			FromA:                     routeFromA,
			FromB:                     routeFromB,
			TotalDurationSeconds:      routeFromA.DurationSeconds + routeFromB.DurationSeconds,
			DurationDifferenceSeconds: abs(routeFromA.DurationSeconds - routeFromB.DurationSeconds),
			MaxDurationSeconds:        max(routeFromA.DurationSeconds, routeFromB.DurationSeconds),
		}
		meetingOptions = append(meetingOptions, option)
	}

	return meetingOptions, nil

}
