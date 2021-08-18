import $ from 'jquery'
import {apiEndpoint, scrollTo} from '@/utils'
import Sidebar from '@/components/sidebar'
import Content from '@/components/content'

export default class {
    static scrolling = false
    static allFiles = {}
    static currentFile = {}
    static currentHeading = {}
    static mathElements = {}

    static open(path, done) {
        if (!this.allFiles.list) {
            return done(false)
        }

        let file = null
        let isSwitch = false
        for (let i = 0; i < this.allFiles.list.length; i++) {
            if (path === this.allFiles.list[i].path) {
                file = this.allFiles.list[i]
                break
            }
        }

        if (!file) {
            return done(false)
        }

        isSwitch = file.path !== this.currentFile.path
        this.currentFile = file
        localStorage.setItem('recent:' + this.allFiles.root, file.path)

        Sidebar.scrollToFit()
        $('#files li').removeClass('active')
        $('#files li[path="' + file.path + '"]').addClass('active')
        if (file.path !== decodeURIComponent(location.pathname)) {
            history.pushState(null, '', file.path)
        }

        $.post(apiEndpoint('file'), {
            path: file.path
        }, (html) => {
            $('#content').html(html)

            const toc = $('#table-of-contents').html() || ''
            $('#outline').html() !== toc && $('#outline').html(toc)
            $('#table-of-contents').remove()
            Content.renderAsync()

            this.currentHeading = $('.heading[id="' + decodeURIComponent(location.hash.substr(1)) + '"]')
            if (isSwitch && this.currentHeading.length === 0) {
                scrollTo($('#content'), 0, 100)
            } else if (isSwitch) {
                this.currentHeading.find('.heading-anchor').click()
            }

            done && done(file)
        })
    }

    static openRecent(done) {
        let path
        if (/\.md$/.test(location.pathname)) {
            path = decodeURIComponent(location.pathname)
        } else {
            path = localStorage.getItem('recent:' + this.allFiles.root)
        }

        this.open(path, done)
    }

    static openReadme(done) {
        if (!this.allFiles.list) {
            return done(false)
        }

        const finds = []
        for (let i = 0; i < this.allFiles.list.length; i++) {
            if (this.allFiles.list[i].name.toLowerCase() === 'readme.md') {
                finds.push(this.allFiles.list[i].path)
            }
        }

        if (finds.length < 1) {
            return done(false)
        }

        finds.sort(function (a, b) {
            return a.length > b.length ? 1 : -1
        })

        this.open(finds.shift(), done)
    }

    static openFirst(done) {
        if (this.allFiles.list && this.allFiles.list.length > 0) {
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
