package meeting

import "middle-meetup-server/internal/geo"

type Planner struct {
	routes RouteEstimator
}

func NewPlanner(routes RouteEstimator) *Planner {
	return &Planner{
		routes: routes,
	}
}

func (p *Planner) CompareDestinations(locationA geo.Location, locationB geo.Location, potentialLocations []geo.Location) ([]MeetingOption, error) {
	meetingOptions := []MeetingOption{}

	for _, loc := range potentialLocations {
		routeFromA, err := p.routes.EstimateRoute(locationA, loc)
		if err != nil {
			return meetingOptions, err
		}

		routeFromB, err := p.routes.EstimateRoute(locationB, loc)
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
