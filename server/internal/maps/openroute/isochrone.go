package openroute

import (
	"fmt"
	"middle-meetup-server/internal/geo"
)

type isochromeResponse struct {
	Type     string    `json:"type"`
	Bbox     []float64 `json:"bbox"`
	Features []struct {
		Type     string `json:"type"`
		Geometry struct {
			Type        string        `json:"type"`
			Coordinates [][][]float64 `json:"coordinates"`
		} `json:"geometry"`
	} `json:"features"`
}

func (or *OpenRouteClient) BuildIsochrone(origin geo.Location, maxDurationSeconds int) (geo.Polygon, error) {
	reqBody := struct {
		Locations [][]float64 `json:"locations"`
		Range     []int       `json:"range"`
		RangeType string      `json:"range_type"`
	}{
		Locations: [][]float64{coordToOpenRoute(origin.Coord)},
		Range:     []int{maxDurationSeconds},
		RangeType: "time",
	}

	var resp isochromeResponse
	if err := or.postJsonAccept("/isochrones/driving-car", reqBody, &resp, "application/geo+json"); err != nil {
		return geo.Polygon{}, err
	}

	if len(resp.Features) == 0 {
		return geo.Polygon{}, fmt.Errorf("openroute returned no isochrone features")
	}

	geometry := resp.Features[0].Geometry
	if geometry.Type != "Polygon" {
		return geo.Polygon{}, fmt.Errorf("openroute returned unsupported isochrone geometry %q", geometry.Type)
	}

	return geo.Polygon{
		Type:        geometry.Type,
		Coordinates: geometry.Coordinates,
	}, nil
}

func (or *OpenRouteClient) SearchPlaces(query string, near geo.Coord, radiusMeters int) ([]geo.Location, error) {
	return or.GeocodeSearch(query, near, radiusMeters)
}
