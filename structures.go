package main

import (
	"github.com/yuin/goldmark/renderer"
	"strings"
)

type File struct {
	Name      string `json:"name"`
	Path      string `json:"path"`
	Size      int64  `json:"size"`
	Exists    bool   `json:"exists"`
	UpdatedAt int64  `json:"updated_at"`
}

type Files struct {
	Root string  `json:"root"`
	List []*File `json:"list"`
}

type meta struct {
}

type tocHeader struct {
	ID       string
	Text     string
	Children []*tocHeader
}

type tocBuilder struct {
	builder    strings.Builder
	headers    []*tocHeader
	startLevel int
	stopLevel  int
}

type tocTransformer struct {
	renderer renderer.Renderer
}
