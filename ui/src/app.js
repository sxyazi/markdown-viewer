import 'github-markdown-css'
import 'katex/dist/katex.css'
import 'tailwindcss/tailwind.css'
import Template from './template.html'

function load(template) {
    document.body.innerHTML = template

    require('./template.js')
    require('./template.scss')
}

load(Template)
