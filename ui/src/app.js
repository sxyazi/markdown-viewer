import 'github-markdown-css'
import 'katex/dist/katex.css'
import 'tailwindcss/tailwind.css'
import Main from './components/main.html'

function load(template) {
    document.body.innerHTML = template

    require('./components/main.js')
    require('./components/main.scss')
}

load(Main)
