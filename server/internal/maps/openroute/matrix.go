package openroute

import (
	"fmt"
	"middle-meetup-server/internal/geo"
	"middle-meetup-server/internal/meeting"
	"strconv"
)

type orLocation struct {
	Location        []float64 `json:"location"`
	Name            []string  `json:"name"`
	SnappedDistance float64   `json:"snapped_distance"`
}

type matrixResponse struct {
	Durations    [][]float64  `json:"durations"`
	Distances    [][]float64  `json:"distances"`
	Destinations []orLocation `json:"destinations"`
	Sources      []orLocation `json:"sources"`
}

func (or *OpenRouteClient) EstimateRouteMatrix(origins []geo.Location, destinations []geo.Location) (meeting.RouteMatrix, error) {
	if len(origins) == 0 {
		return meeting.RouteMatrix{}, fmt.Errorf("openroute matrix requires at least one origin")
	}
	if len(destinations) == 0 {
		return meeting.RouteMatrix{}, fmt.Errorf("openroute matrix requires at least one destination")
	}

	locations := make([]geo.Location, 0, len(origins)+len(destinations))
	locations = append(locations, origins...)
	locations = append(locations, destinations...)

	reqBody := struct {
		Locations    [][]float64 `json:"locations"`
		Sources      []string    `json:"sources"`
		Destinations []string    `json:"destinations"`
		Metrics      []string    `json:"metrics"`
		Units        string      `json:"units"`
	}{
		Locations:    locationsToOpenRoute(locations),
		Sources:      matrixIndexes(0, len(origins)),
		Destinations: matrixIndexes(len(origins), len(destinations)),
		Metrics:      []string{"distance", "duration"},
		Units:        "m",
	}

	var resp matrixResponse

	err := or.postJson("/matrix/driving-car", reqBody, &resp)

	if err != nil {
		return meeting.RouteMatrix{}, err
	}

	return meeting.RouteMatrix{
		DurationSeconds: floatMatrixToInt(resp.Durations),
		DistanceMeters:  floatMatrixToInt(resp.Distances),
	}, nil
}

func matrixIndexes(start int, count int) []string {
	indexes := make([]string, 0, count)

	for i := range count {
		indexes = append(indexes, strconv.Itoa(start+i))
	}

	return indexes
}

func floatMatrixToInt(values [][]float64) [][]int {
	result := make([][]int, 0, len(values))

	for _, row := range values {
		intRow := make([]int, 0, len(row))
		for _, value := range row {
			intRow = append(intRow, int(value))
		}
		result = append(result, intRow)
	}

	return result
}
