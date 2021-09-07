import $ from 'jquery'
import {apiEndpoint, parsePath, scrollTo, syncLocation} from '@/utils'
import Sidebar from '@/components/sidebar'
import Outline from '@/components/outline'
import Content from '@/components/content'

export default class {
    static scrolling = false
    static allFiles = {}
    static #currentFile = {}
    static #currentHeading = {}
    static mathElements = {}

    static findFile(path) {
        return this.allFiles.list.find(file => file.path === path)
    }

    static get currentFile() {
        return this.#currentFile
    }

    static set currentFile(value) {
        this.#currentFile = value
        localStorage.setItem('recent:' + this.allFiles.root, value.path)
    }

    static get currentHeading() {
        return this.#currentHeading
    }

    static set currentHeading(value) {
        if (value.length &&
            value.is(this.#currentHeading)) return
        this.#currentHeading = value

        if (this.#currentHeading.length)
            Outline.activate(value.attr('id'))
    }

    static open(uri, done) {
        if (!this.allFiles.list)
            return done(false)

        const [path, hash] = parsePath(uri)
        let file = this.findFile(path)
        if (!file) return done(false)

        this.currentFile = file
        Sidebar.activate(file.path)

        $.post(apiEndpoint('file'), {
            path: file.path
        }, (html) => {
            $('#content').html(html)
            Content.renderAsync()

            if (hash === '')
                scrollTo($('#content'), 0, 100)
            else
                setTimeout(() => $('.heading-anchor[href="' + hash + '"]').click())

            Outline.update()
            syncLocation(uri)

            done && done(file)
        })
    }

    static openRecent(done) {
        let uri
        if (/\.md$/.test(location.pathname))
            uri = location.pathname + location.hash
        else
            uri = localStorage.getItem('recent:' + this.allFiles.root)

        this.open(uri, done)
    }

    static openReadme(done) {
        if (!this.allFiles.list)
            return done(false)

        const file = this.allFiles.list.find(file => file.path.toLowerCase() === '/readme.md')
        if (!file)
            return done(false)

        this.open(file.path, done)
    }

    static openFirst(done) {
        if (this.allFiles.list && this.allFiles.list.length) {
            return this.open(this.allFiles.list[0].path, done)
        }

        return done(false)
    }

    static openQueue(queue = null) {
        if (queue === null) {
            queue = [this.openRecent, this.openReadme, this.openFirst]
        }

        const fn = queue.shift()
        fn && fn.call(this, (flag) => {
            flag || this.openQueue(queue)
        })
    }
}
