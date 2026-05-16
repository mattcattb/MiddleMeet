package openroute

import "testing"

func TestDecodePolyline(t *testing.T) {
	points, err := decodePolyline("_p~iF~ps|U_ulLnnqC_mqNvxq`@")
	if err != nil {
		t.Fatal(err)
	}

	want := []struct {
		lat float64
		lng float64
	}{
		{38.5, -120.2},
		{40.7, -120.95},
		{43.252, -126.453},
	}

	if len(points) != len(want) {
		t.Fatalf("got %d points, want %d", len(points), len(want))
	}

	for i := range want {
		if points[i].Lat != want[i].lat || points[i].Lng != want[i].lng {
			t.Fatalf("point %d = %+v, want lat=%f lng=%f", i, points[i], want[i].lat, want[i].lng)
		}
	}
}

func TestMatrixIndexes(t *testing.T) {
	indexes := matrixIndexes(2, 3)
	want := []string{"2", "3", "4"}

	if len(indexes) != len(want) {
		t.Fatalf("got %d indexes, want %d", len(indexes), len(want))
	}

	for i := range want {
		if indexes[i] != want[i] {
			t.Fatalf("index %d = %q, want %q", i, indexes[i], want[i])
		}
	}
}
