package meeting

import (
	"fmt"
)

func (p *Planner) BuildMeetingArea(participants []Participant, constraints MeetingConstraints) (MeetingArea, error) {
	if len(participants) == 0 {
		return MeetingArea{}, fmt.Errorf("meeting area requires at least one participant")
	}

	if constraints.MaxDurationSeconds <= 0 {
		return MeetingArea{}, fmt.Errorf("meeting area requires maxDurationSeconds")
	}

	areas := make([]ParticipantArea, 0, len(participants))
	for _, participant := range participants {
		area, err := p.areas.BuildIsochrone(participant.Location, constraints.MaxDurationSeconds)
		if err != nil {
			return MeetingArea{}, err
		}

		areas = append(areas, ParticipantArea{
			ParticipantName: participant.Name,
			Area:            area,
		})
	}

	return MeetingArea{
		Participants: areas,
	}, nil
}
