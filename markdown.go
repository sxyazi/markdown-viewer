package main

import (
	"bytes"
	"fmt"
	"github.com/PuerkitoBio/goquery"
	"github.com/litao91/goldmark-mathjax"
	"github.com/yuin/goldmark"
	goldmarkmeta "github.com/yuin/goldmark-meta"
	"github.com/yuin/goldmark/ast"
	"github.com/yuin/goldmark/extension"
	"github.com/yuin/goldmark/parser"
	"github.com/yuin/goldmark/renderer/html"
	"github.com/yuin/goldmark/util"
	"io/ioutil"
	"path"
	"strings"
)

type HeadingIDs struct {
	times map[string]int
}

func (s *HeadingIDs) Generate(value []byte, kind ast.NodeKind) []byte {
	return distinct(purify(value), s.times)
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
	md := markdownInstance()
	//source = simplifyCodeBlock(source)  //TODO
	context := parser.NewContext(parser.WithIDs(&HeadingIDs{times: map[string]int{}}))

	ret = new(bytes.Buffer)
	if e = md.Convert(source, ret, parser.WithContext(context)); e != nil {
		return
	}

	retBytes := ret.Bytes()
	if bytes.Contains(retBytes, []byte(":toc:")) {
		tocHTML := context.Get(tocResult).(*tocBuilder).Build(2, 5)
		ret.Reset()
		ret.Write(bytes.ReplaceAll(retBytes, []byte(":toc:"), []byte(tocHTML)))
	}

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
		} else if !strings.HasPrefix(href, "#") {
			selection.SetAttr("href", path.Clean("/"+href))
		}
	})

	doc.Find("pre").Each(func(i int, selection *goquery.Selection) {
		if class, ok := selection.Find("code").Attr("class"); ok {
			selection.AddClass(class)
		}
	})

	doc.Find("math").Each(func(i int, selection *goquery.Selection) {
		htm, _ := selection.Html()
		if _, block := selection.Attr("block"); block {
			htm = `<span class="math display">\[` + htm + "\n" + `\]</span>`
		} else {
			htm = `<span class="math inline">\(` + htm + `\)</span>`
		}

		selection.ReplaceWithHtml(htm)
	})

	doc.Find("details").Each(func(i int, selection *goquery.Selection) {
		if selection.Find("summary").Length() < 1 {
			selection.PrependHtml("<summary>Details</summary>")
		}
	})

	doc.Find("h1,h2,h3,h4,h5,h6").Each(func(i int, selection *goquery.Selection) {
		htm, _ := selection.Html()
		id, _ := selection.Attr("id")
		selection.AddClass("heading")
		selection.SetHtml(fmt.Sprintf("<a class=\"heading-anchor\" href=\"#%s\">#</a>%s", id, htm))
	})

	return doc.Html()
}

func markdownInstance() goldmark.Markdown {
	return goldmark.New(
		goldmark.WithExtensions(
			extension.GFM,
			extension.Table,
			extension.TaskList,
			extension.Footnote,
			extension.Strikethrough,

			goldmarkmeta.Meta,
			mathjax.MathJax,
		),
		goldmark.WithParserOptions(
			parser.WithAutoHeadingID(),
			parser.WithASTTransformers(util.Prioritized(&tocTransformer{
				renderer: goldmark.DefaultRenderer(),
			}, 10)),
		),
		goldmark.WithRendererOptions(
			html.WithHardWraps(),
			html.WithXHTML(),
			html.WithUnsafe(),
		),
	)
}
