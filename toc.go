package main

import (
	"bytes"
	"fmt"
	"github.com/yuin/goldmark/ast"
	"github.com/yuin/goldmark/parser"
	"github.com/yuin/goldmark/text"
)

var tocResult = parser.NewContextKey()

func (b *tocBuilder) Add(header *tocHeader, index, level int) {
	for i := len(b.headers); i <= index; i++ {
		b.headers = append(b.headers, &tocHeader{})
	}

	if level == 0 {
		b.headers[index] = header
		return
	}

	h := b.headers[index]
	for i := 1; i < level; i++ {
		if len(h.Children) == 0 {
			h.Children = append(h.Children, &tocHeader{})
		}
		h = h.Children[len(h.Children)-1]
	}
	h.Children = append(h.Children, header)
}

func (b *tocBuilder) Build(startLevel, stopLevel int) string {
	b.startLevel, b.stopLevel = startLevel, stopLevel
	b.builder.WriteString("<nav id=\"table-of-contents\">")
	b.buildHeaders(1, b.headers)
	b.builder.WriteString("</nav>")
	return b.builder.String()
}

func (b *tocBuilder) buildHeaders(level int, h []*tocHeader) {
	if level < b.startLevel {
		for _, h := range h {
			b.buildHeaders(level+1, h.Children)
		}
		return
	}

	if b.stopLevel != -1 && level > b.stopLevel {
		return
	}

	if len(h) > 0 {
		b.builder.WriteString("<ul>")
	}

	for _, h := range h {
		b.builder.WriteString("<li>")
		if h.ID != "" || h.Text != "" {
			b.builder.WriteString(fmt.Sprintf("<a href=\"#%s\">%s</a>", h.ID, h.Text))
		}
		b.buildHeaders(level+1, h.Children)
		b.builder.WriteString("</li>")
	}

	if len(h) > 0 {
		b.builder.WriteString("</ul>")
	}
}

func (t *tocTransformer) Transform(node *ast.Document, reader text.Reader, context parser.Context) {
	var (
		index     = -1
		level     = 0
		inHeading = false
		header    = &tocHeader{}
		builder   = &tocBuilder{}
		buffer    = &bytes.Buffer{}
	)

	ast.Walk(node, func(n ast.Node, entering bool) (ret ast.WalkStatus, e error) {
		ret = ast.WalkContinue
		if n.Kind() == ast.KindHeading && entering {
			inHeading = true
		}

		if n.Kind() == ast.KindHeading && !entering {
			inHeading = false

			header.Text = buffer.String()
			buffer.Reset()
			builder.Add(header, index, level-1)
			header = &tocHeader{}
		}

		if !inHeading || !entering {
			return
		}

		switch n.Kind() {
		case ast.KindHeading:
			heading := n.(*ast.Heading)
			level = heading.Level

			if level == 1 || index == -1 {
				index++
			}

			if id, ok := heading.AttributeString("id"); ok {
				header.ID = string(id.([]byte))
			}

		default:
			ret = ast.WalkSkipChildren
			e = t.renderer.Render(buffer, reader.Source(), n)
		}

		return
	})

	context.Set(tocResult, builder)
}
