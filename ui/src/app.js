import 'github-markdown-css'
import 'katex/dist/katex.css'
import 'tailwindcss/tailwind.css'
import Layout from './components/layout.html'

function load(template) {
    document.body.innerHTML = template

    require('./components/layout.js')
    require('./components/layout.scss')
}

load(Layout)
