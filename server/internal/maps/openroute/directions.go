package openroute

import (
	"fmt"
	"middle-meetup-server/internal/geo"
	"middle-meetup-server/internal/meeting"
)

type directionsResponse struct {
	Routes []struct {
		Summary struct {
			Distance float64 `json:"distance"`
			Duration float64 `json:"duration"`
		} `json:"summary"`

		Segments []struct {
			Distance float64 `json:"distance"`
			Duration float64 `json:"duration"`

			Steps []struct {
				Distance    float64 `json:"distance"`
				Duration    float64 `json:"duration"`
				Instruction string  `json:"instruction"`
				Name        string  `json:"name"`
				Type        int     `json:"type"`
				WayPoints   []int   `json:"way_points"`
			} `json:"steps"`
		} `json:"segments"`

		WayPoints []int     `json:"way_points"`
		BBox      []float64 `json:"bbox"`

		Geometry string `json:"geometry"`
	} `json:"routes"`
}

func (or *OpenRouteClient) EstimateRoute(from geo.Location, to geo.Location) (est meeting.RouteEstimate, err error) {
	reqBody := struct {
		Coordinates [][]float64 `json:"coordinates"`
	}{
		Coordinates: coordsToOpenRoute([]geo.Coord{from.Coord, to.Coord}),
	}

	var resp directionsResponse
	if err := or.postJson("/directions/driving-car", reqBody, &resp); err != nil {
		return est, err
	}

	if len(resp.Routes) == 0 {
		return est, fmt.Errorf("openroute returned no routes")
	}

	firstRoute := resp.Routes[0]
	for _, route := range resp.Routes[1:] {
		if route.Summary.Duration < firstRoute.Summary.Duration {
			firstRoute = route
		}
	}

	routePoints, err := decodePolyline(firstRoute.Geometry)
	if err != nil {
		return est, fmt.Errorf("decode openroute geometry: %w", err)
	}

	est.DistanceMeters = int(firstRoute.Summary.Distance)
	est.DurationSeconds = int(firstRoute.Summary.Duration)
	est.From = from
	est.To = to
	est.BBox = firstRoute.BBox
	est.Geometry = geo.RouteGeometry{
		Polyline: firstRoute.Geometry,
		Points:   routePoints,
	}

	for _, segment := range firstRoute.Segments {
		for _, step := range segment.Steps {
			routeStep := geo.RouteStep{
				Instruction:     step.Instruction,
				Name:            step.Name,
				DistanceMeters:  int(step.Distance),
				DurationSeconds: int(step.Duration),
				Type:            step.Type,
				WayPoints:       step.WayPoints,
			}

			if len(step.WayPoints) == 2 {
				startIndex := step.WayPoints[0]
				endIndex := step.WayPoints[1]

				if startIndex >= 0 && startIndex < len(routePoints) {
					start := routePoints[startIndex]
					routeStep.Start = &start
				}

				if endIndex >= 0 && endIndex < len(routePoints) {
					end := routePoints[endIndex]
					routeStep.End = &end
				}
			}

			est.Steps = append(est.Steps, routeStep)
		}
	}

	return est, nil
}
