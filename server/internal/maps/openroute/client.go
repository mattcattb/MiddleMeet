package openroute

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"middle-meetup-server/internal/geo"
	"net/http"
	"net/url"
	"time"
)

const openRouteBaseURL = "https://api.openrouteservice.org"

type OpenRouteClient struct {
	ApiKey string
	client *http.Client
}

func NewClient(apiKey string) *OpenRouteClient {
	return &OpenRouteClient{
		ApiKey: apiKey,
		client: &http.Client{Timeout: 10 * time.Second},
	}
}

func (or *OpenRouteClient) postJson(path string, body any, out any) error {

	endpoint, err := url.Parse(openRouteBaseURL + "/v2" + path)

	if err != nil {
		return err
	}

	jsonBytes, err := json.Marshal(body)
	if err != nil {
		return fmt.Errorf("json marshaling failed for %s call: %w", path, err)
	}

	req, err := http.NewRequest(http.MethodPost, endpoint.String(), bytes.NewBuffer(jsonBytes))

	if err != nil {
		return err
	}

	req.Header.Add("Accept", "application/json")
	req.Header.Add("Authorization", or.ApiKey)
	req.Header.Add("Content-Type", "application/json; charset=utf-8")

	respRaw, err := or.client.Do(req)
	if err != nil {
		return err
	}

	defer respRaw.Body.Close()
	respBody, err := io.ReadAll(respRaw.Body)
	if err != nil {
		return err
	}

	if respRaw.StatusCode < 200 || respRaw.StatusCode >= 300 {
		return fmt.Errorf("openroute request failed: status %d: %s", respRaw.StatusCode, string(respBody))
	}

	if err := json.Unmarshal(respBody, out); err != nil {
		return fmt.Errorf("failed to deserialize response")
	}

	return nil
}

func (or *OpenRouteClient) getJson(path string, query map[string]string, out any) error {
	endpoint, err := url.Parse(openRouteBaseURL + path)
	if err != nil {
		return err
	}

	vals := endpoint.Query()
	vals.Set("api_key", or.ApiKey)
	for key, value := range query {
		vals.Set(key, value)
	}
	endpoint.RawQuery = vals.Encode()

	req, err := http.NewRequest(http.MethodGet, endpoint.String(), nil)
	if err != nil {
		return err
	}

	req.Header.Add("Accept", "application/json")

	respRaw, err := or.client.Do(req)
	if err != nil {
		return err
	}

	defer respRaw.Body.Close()
	respBody, err := io.ReadAll(respRaw.Body)
	if err != nil {
		return err
	}

	if respRaw.StatusCode < 200 || respRaw.StatusCode >= 300 {
		return fmt.Errorf("openroute request failed: status %d: %s", respRaw.StatusCode, string(respBody))
	}

	if err := json.Unmarshal(respBody, out); err != nil {
		return fmt.Errorf("failed to deserialize response")
	}

	return nil
}

func decodePolyline(encoded string) ([]geo.Coord, error) {
	points := []geo.Coord{}
	index := 0
	lat := 0
	lng := 0

	for index < len(encoded) {
		deltaLat, nextIndex, err := decodePolylineValue(encoded, index)
		if err != nil {
			return nil, err
		}
		index = nextIndex

		deltaLng, nextIndex, err := decodePolylineValue(encoded, index)
		if err != nil {
			return nil, err
		}
		index = nextIndex

		lat += deltaLat
		lng += deltaLng

		points = append(points, geo.Coord{
			Lat: float64(lat) / 1e5,
			Lng: float64(lng) / 1e5,
		})
	}

	return points, nil
}

func coordToOpenRoute(coord geo.Coord) []float64 {
	return []float64{coord.Lng, coord.Lat}
}

func coordsToOpenRoute(coords []geo.Coord) [][]float64 {
	openRouteCoords := make([][]float64, 0, len(coords))

	for _, coord := range coords {
		openRouteCoords = append(openRouteCoords, coordToOpenRoute(coord))
	}

	return openRouteCoords
}

func locationsToOpenRoute(locations []geo.Location) [][]float64 {
	openRouteCoords := make([][]float64, 0, len(locations))

	for _, location := range locations {
		openRouteCoords = append(openRouteCoords, coordToOpenRoute(location.Coord))
	}

	return openRouteCoords
}

func decodePolylineValue(encoded string, index int) (int, int, error) {
	result := 0
	shift := 0

	for {
		if index >= len(encoded) {
			return 0, index, fmt.Errorf("invalid encoded polyline")
		}

		value := int(encoded[index]) - 63
		index++
		result |= (value & 0x1f) << shift
		shift += 5

		if value < 0x20 {
			break
		}
	}

	if result&1 != 0 {
		return ^(result >> 1), index, nil
	}

	return result >> 1, index, nil
}
