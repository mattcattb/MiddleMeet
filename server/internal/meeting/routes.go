package meeting

import "middle-meetup-server/internal/geo"

func (p *Planner) BuildMeetingRoutes(participants []Participant, destination geo.Location) (MeetingRoutes, error) {
	routes := make([]ParticipantRoute, 0, len(participants))

	for _, participant := range participants {
		route, err := p.routes.EstimateRoute(participant.Location, destination)
		if err != nil {
			return MeetingRoutes{}, err
		}

		routes = append(routes, ParticipantRoute{
			ParticipantName: participant.Name,
			Route:           route,
		})
	}

	return MeetingRoutes{
		Destination: destination,
		Routes:      routes,
	}, nil
}
