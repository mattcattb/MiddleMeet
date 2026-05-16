package meeting

import (
	"fmt"
	"middle-meetup-server/internal/geo"
)

type Planner struct {
	routes RouteEstimator
	areas  AreaEstimator
	places PlaceFinder
}

func NewPlanner(routes RouteEstimator, areas AreaEstimator, places PlaceFinder) *Planner {
	return &Planner{
		routes: routes,
		areas:  areas,
		places: places,
	}
}

func (p *Planner) EstimateMeeting(participants []Participant, destination geo.Location) (MeetingEstimate, error) {
	if len(participants) == 0 {
		return MeetingEstimate{}, fmt.Errorf("estimate meeting requires at least one participant")
	}

	origins := make([]geo.Location, 0, len(participants))
	for _, participant := range participants {
		origins = append(origins, participant.Location)
	}

	matrix, err := p.routes.EstimateRouteMatrix(origins, []geo.Location{destination})
	if err != nil {
		return MeetingEstimate{}, err
	}

	estimates := make([]ParticipantEstimate, 0, len(participants))
	totalDuration := 0
	maxDuration := 0
	minDuration := 0
	destinationIndex := 0

	for participantIndex, participant := range participants {
		if participantIndex >= len(matrix.DurationSeconds) || destinationIndex >= len(matrix.DurationSeconds[participantIndex]) {
			return MeetingEstimate{}, fmt.Errorf("route matrix missing duration for participant %d", participantIndex)
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
