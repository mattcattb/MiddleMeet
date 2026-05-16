package openroute

import (
	"fmt"
	"middle-meetup-server/internal/geo"
	"strconv"
)

type geocodeResponse struct {
	Features []struct {
		Geometry struct {
			Coordinates []float64 `json:"coordinates"`
		} `json:"geometry"`
		Properties struct {
			Name  string `json:"name"`
			Label string `json:"label"`
		} `json:"properties"`
	} `json:"features"`
}

func (or *OpenRouteClient) GeocodeSearch(query string, near geo.Coord, radiusMeters int) (locations []geo.Location, err error) {
	var resp geocodeResponse
	err = or.getJson("/geocode/search", map[string]string{
		"text":                   query,
		"size":                   "5",
		"focus.point.lat":        formatFloat(near.Lat),
		"focus.point.lon":        formatFloat(near.Lng),
		"boundary.circle.lat":    formatFloat(near.Lat),
		"boundary.circle.lon":    formatFloat(near.Lng),
		"boundary.circle.radius": formatFloat(float64(radiusMeters) / 1000),
	}, &resp)

	if err != nil {
		return locations, err
	}

	return locationsFromGeocodeResponse(resp), nil
}

func (or *OpenRouteClient) GeocodeAutocomplete(query string, near geo.Coord) (locations []geo.Location, err error) {
	var resp geocodeResponse
	err = or.getJson("/geocode/autocomplete", map[string]string{
		"text":            query,
		"size":            "5",
		"focus.point.lat": formatFloat(near.Lat),
		"focus.point.lon": formatFloat(near.Lng),
	}, &resp)

	if err != nil {
		return locations, err
	}

	return locationsFromGeocodeResponse(resp), nil
}

func (or *OpenRouteClient) ReverseGeocode(coord geo.Coord) (location geo.Location, err error) {
	var resp geocodeResponse
	err = or.getJson("/geocode/reverse", map[string]string{
		"point.lat": formatFloat(coord.Lat),
		"point.lon": formatFloat(coord.Lng),
		"size":      "1",
	}, &resp)

	if err != nil {
		return location, err
	}

	locations := locationsFromGeocodeResponse(resp)
	if len(locations) == 0 {
		return location, fmt.Errorf("openroute returned no reverse geocode results")
	}

	return locations[0], nil
}

func locationsFromGeocodeResponse(resp geocodeResponse) []geo.Location {
	locations := make([]geo.Location, 0, len(resp.Features))

	for _, feature := range resp.Features {
		coords := feature.Geometry.Coordinates
		if len(coords) < 2 {
			continue
		}

		name := feature.Properties.Name
		if name == "" {
			name = feature.Properties.Label
		}

		locations = append(locations, geo.Location{
			Name:    name,
			Address: feature.Properties.Label,
			Coord: geo.Coord{
				Lat: coords[1],
				Lng: coords[0],
			},
		})
	}

	return locations
}

func formatFloat(value float64) string {
	return strconv.FormatFloat(value, 'f', -1, 64)
}
