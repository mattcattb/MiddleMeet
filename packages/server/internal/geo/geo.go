package geo

type Coord struct {
	Lat float64 `json:"lat"`
	Lng float64 `json:"lng"`
}

type Location struct {
	Name    string `json:"name"`
	Address string `json:"address"`
	Coord   Coord  `json:"coord"`
}

type RouteGeometry struct {
	Polyline string  `json:"polyline"`
	Points   []Coord `json:"points,omitempty"`
}

type RouteStep struct {
	Instruction     string
	DistanceMeters  int
	DurationSeconds int
	Start           Coord
	End             Coord
}
