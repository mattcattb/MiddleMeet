package meeting

type MidpointResponse struct {
	Midpoint   DestinationCandidate
	Candidates []DestinationCandidate
}

func (p *Planner) FindMidpoint(participants []Participant, constraints MeetingConstraints) (MidpointResponse, error) {
	return MidpointResponse{}, nil
}
