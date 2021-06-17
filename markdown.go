package main

import (
	"bytes"
	"github.com/PuerkitoBio/goquery"
	"github.com/litao91/goldmark-mathjax"
	"github.com/yuin/goldmark"
	"github.com/yuin/goldmark-highlighting"
	"github.com/yuin/goldmark-meta"
	"github.com/yuin/goldmark/ast"
	"github.com/yuin/goldmark/extension"
	"github.com/yuin/goldmark/parser"
	"github.com/yuin/goldmark/renderer/html"
	"io/ioutil"
	"path"
	"strings"
)

type HeadingIDs struct {
}

func (s *HeadingIDs) Generate(value []byte, kind ast.NodeKind) []byte {
	return value
}

func (s *HeadingIDs) Put(value []byte) {
}

func markdown(p string) (ret string, e error) {
	data, e := ioutil.ReadFile(p)
	if e != nil {
		return
	}

	var output *bytes.Buffer
	if output, e = markdownRender(data); e != nil {
		return
	}

	return markdownFilter(p, output)
}

func markdownRender(source []byte) (ret *bytes.Buffer, e error) {
	md := goldmark.New(
		goldmark.WithExtensions(
			extension.GFM,
			extension.Table,
			extension.TaskList,
			extension.Footnote,
			extension.Strikethrough,

			meta.Meta,
			mathjax.MathJax,
			highlighting.NewHighlighting(
				highlighting.WithStyle("github"),
			),
		),
		goldmark.WithParserOptions(
			parser.WithAutoHeadingID(),
		),
		goldmark.WithRendererOptions(
			html.WithXHTML(),
			html.WithUnsafe(),
		),
	)

	context := parser.WithContext(
		parser.NewContext(parser.WithIDs(&HeadingIDs{})),
	)

	ret = new(bytes.Buffer)
	e = md.Convert(source, ret, context)
	return
}

func markdownFilter(p string, output *bytes.Buffer) (ret string, e error) {
	doc, e := goquery.NewDocumentFromReader(output)
	if e != nil {
		return
	}

	parent := path.Dir(p)
	doc.Find("img").Each(func(i int, selection *goquery.Selection) {
		src, _ := selection.Attr("src")
		selection.SetAttr("src", forwardResource(parent, src))
	})

	doc.Find("a").Each(func(i int, selection *goquery.Selection) {
		href, _ := selection.Attr("href")

		if isExternalLink(href) {
			selection.SetAttr("target", "_blank")
		} else {
			selection.SetAttr("href", "/"+strings.TrimLeft(href, "/"))
		}
	})

	return doc.Html()
}
