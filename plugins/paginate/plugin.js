// @ts-check
// import { join } from "path";

/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/license
 */

/**
 * @fileOverview Horizontal Page Break
 */

'use strict';

(function() {
    // Register a plugin named "paginate".
    CKEDITOR.plugins.add('paginate', {
        requires: 'fakeobjects',
        // jscs:disable maximumLineLength
        // lang: 'af,ar,az,bg,bn,bs,ca,cs,cy,da,de,de-ch,el,en,en-au,en-ca,en-gb,eo,es,es-mx,et,eu,fa,fi,fo,fr,fr-ca,gl,gu,he,hi,hr,hu,id,is,it,ja,ka,km,ko,ku,lt,lv,mk,mn,ms,nb,nl,no,oc,pl,pt,pt-br,ro,ru,si,sk,sl,sq,sr,sr-latn,sv,th,tr,tt,ug,uk,vi,zh,zh-cn', // %REMOVE_LINE_CORE%
        // jscs:enable maximumLineLength
        // icons: 'pagebreak,pagebreak-rtl', // %REMOVE_LINE_CORE%
        hidpi: true, // %REMOVE_LINE_CORE%
        onLoad: function() {},

        init: function(editor) {
            editor.once('instanceReady', () => {
                var src =
                    'document.open();' +
                    // In IE, the document domain must be set any time we call document.open().
                    (CKEDITOR.env.ie
                        ? '(' + CKEDITOR.tools.fixDomain + ')();'
                        : '') +
                    'document.close();';

                // With IE, the custom domain has to be taken care at first,
                // for other browers, the 'src' attribute should be left empty to
                // trigger iframe's 'load' event.
                // Microsoft Edge throws "Permission Denied" if treated like an IE (https://dev.ckeditor.com/ticket/13441).
                if (CKEDITOR.env.air) {
                    src = 'javascript:void(0)'; // jshint ignore:line
                } else if (CKEDITOR.env.ie && !CKEDITOR.env.edge) {
                    src =
                        'javascript:void(function(){' +
                        encodeURIComponent(src) +
                        '}())'; // jshint ignore:line
                } else {
                    src = '';
                }

                var iframe = CKEDITOR.dom.element.createFromHtml(
                    '<iframe src="' + src + '" frameBorder="0"></iframe>'
                );
                iframe.setStyles({ width: '100%', height: '100%' });
				iframe.addClass('cke_wysiwyg_frame').addClass('cke_reset');

				const oldIframe = document.querySelector('iframe');

				var contentSpace = editor.ui.space( 'contents' );
				contentSpace.append( iframe );

				oldIframe.style.display = 'none';

                // var contentSpace = editor.ui.space('contents');
                // document.getElementById('preview').appendChild(iframe.$);

                const editable = editor.editable();

                iframe.$.contentWindow.document.documentElement.innerHTML =
					editor.document.$.documentElement.innerHTML;

				console.log(editor.document);

                const previewWin = iframe.$.contentWindow;

                const previewBody = previewWin.document.body;
                previewBody.contentEditable = true;

                function getNode(root, path, idx = 0) {
                    if (idx < path.length) {
                        return getNode(
                            root.childNodes[path[idx]],
                            path,
                            idx + 1
                        );
                    } else {
                        return root;
                    }
                }

                function buildPath(element) {
                    const path = [];

                    let parent = element;
                    while (parent !== previewBody) {
                        path.push(
                            Array.prototype.indexOf.call(
                                parent.parentNode.childNodes,
                                parent
                            )
                        );

                        parent = parent.parentNode;
                    }

                    return path.reverse();
                }

                previewWin.document.addEventListener('selectionchange', evt => {
                    const range = previewWin.getSelection().getRangeAt(0);
                    const hiddenWindow = editor.document.$.defaultView;
                    const hiddenDocument = editor.document.$;

					const hiddenSelection = hiddenWindow.getSelection();
					if (hiddenSelection.rangeCount === 0) {
						const newRange = hiddenDocument.createRange();
						newRange.setStart(hiddenDocument.body, 0);
						newRange.setEnd(hiddenDocument.body, 0);
						hiddenSelection.addRange(newRange);
					}
                    const hiddenRange = hiddenSelection.getRangeAt(0);
                    const container = range.startContainer;

                    editable.$.focus();
                    if (container.originalNode) {
                        const trueOffset =
                            (container.trueOffset || 0) + range.startOffset;
                        console.log(
                            'Offset Calculation:',
                            container.trueOffset || 0,
                            range.startOffset,
                            trueOffset
                        );

                        hiddenRange.setStart(
                            container.originalNode,
                            trueOffset
                        );
                        hiddenRange.setEnd(container.originalNode, trueOffset);

                        console.log(
                            'Node, Offset:',
                            hiddenWindow,
                            container.originalNode,
                            trueOffset
                        );
                    } else {
						const path = buildPath(container);

						const hiddenNode = getNode(editor.document.$.body, path);
						hiddenRange.setStart(hiddenNode, range.startOffset);
						hiddenRange.setEnd(hiddenNode, range.startOffset);

                    }
                });

                const observer = new MutationObserver(() => {
                    const html = editable.getHtml();

                    previewBody.innerHTML = html;
                });

                editable.$.addEventListener('input', htmlModified);

                const range = document.createRange();
                // const pageHeight = 800;
                const pageHeight = 100;

                function findSplitElement(root, breakPoint, clientTop, path) {
                    if (!root.childNodes.length) {
                        return root;
                    }

                    root.normalize();

                    // console.log(Array.from(root.childNodes).map(n => {range.selectNodeContents(n); return [range.getBoundingClientRect().top - clientTop, range.getBoundingClientRect().bottom - clientTop];}).map(r => `[${r[0]}->${r[1]}]`).join(', '))
                    // [3->20], [43->60], [83->100], [123->140], [163->180], [203->220], [243->260], [283->300], [323->340]

                    let [lowerBound, upperBound] = [
                        0,
                        root.childNodes.length - 1
                    ];

                    let current = root.childNodes[0];
                    let pivot = 0;
                    while (upperBound !== lowerBound) {
                        pivot = Math.floor((upperBound + lowerBound) / 2);
                        current = root.childNodes[pivot];
                        range.selectNodeContents(current);

                        const rect = range.getBoundingClientRect();
                        console.log('Ranges:', rect.top, clientTop);

                        if (breakPoint <= rect.top - clientTop) {
                            if (upperBound - lowerBound === 1) {
                                path.push(pivot);
                                return findSplitElement(
                                    current,
                                    breakPoint,
                                    clientTop,
                                    path
                                );
                            }
                            // console.log('<-]');
                            upperBound = pivot;
                        } else if (breakPoint >= rect.bottom - clientTop) {
                            if (upperBound - lowerBound === 1) {
                                path.push(pivot + 1);
                                return findSplitElement(
                                    root.childNodes[pivot + 1],
                                    breakPoint,
                                    clientTop,
                                    path
                                );
                            }
                            // console.log('[->');
                            lowerBound = pivot;
                        } else {
                            // If we're down to the last two, then pivot *SHOULD* be pointing to the first element
                            // that we collide with and we can explore further.

                            // TODO: We can merge this with the first if, I believe.
                            if (upperBound - lowerBound === 1) {
                                path.push(pivot);
                                return findSplitElement(
                                    current,
                                    breakPoint,
                                    clientTop,
                                    path
                                );
                            }

                            upperBound = pivot;
                        }
                    }

                    path.push(pivot);
                    return findSplitElement(
                        current,
                        breakPoint,
                        clientTop,
                        path
                    );
                }

                function findTextNodeSplit(element, breakPoint, clientTop) {
                    const textContent = element.textContent;

                    let [lowerBound, upperBound] = [0, textContent.length];

                    while (lowerBound !== upperBound) {
                        const pivot = Math.floor((upperBound + lowerBound) / 2);

                        range.setStart(element, pivot);
                        range.setEnd(element, pivot);

                        // console.log(`Range: [${lowerBound}, ${upperBound}]`)

                        const rect = range.getBoundingClientRect();
                        console.log(
                            pivot,
                            rect,
                            rect.top,
                            clientTop,
                            breakPoint,
                            rect.top - clientTop
                        );

                        if (breakPoint <= rect.bottom - clientTop) {
                            // console.log(`<-] ${breakPoint} <= ${rect.top - clientTop}`);
                            if (upperBound - lowerBound === 1) {
                                return pivot;
                            }
                            upperBound = pivot;
                        } else {
                            // console.log(`[-> ${breakPoint} > ${rect.top - clientTop}`);
                            if (upperBound - lowerBound === 1) {
                                return pivot + 1;
                            }
                            lowerBound = pivot;
                        }
                    }

                    return lowerBound;
                }

                function htmlModified() {
                    const html = editable.getHtml();

                    const root = editor.document.$.body;

                    let pageNumber = 0;
                    // const computed = window.getComputedStyle(root.children[0]);
                    // console.log(computed.marginTop);
                    const clientPageTop = root.children[0].getBoundingClientRect()
                        .top;
                    console.log('Page Top:', clientPageTop);
                    const splitElements = [];

                    let pageTop = clientPageTop;

                    while (1) {
                        pageNumber += 1;
                        const pageStart = pageHeight;
                        console.log(pageStart, pageTop);

                        const path = [];
                        const element = findSplitElement(
                            root,
                            pageStart,
                            pageTop,
                            path
                        );

                        if (!element) {
                            break;
                        }

                        range.selectNode(element);

                        if (
                            range.getBoundingClientRect().bottom - pageTop <=
                            pageStart
                        ) {
                            break;
                        }

                        if (pageNumber > 10000) {
                            // TODO: Remove for prod.
                            throw new Error('Probably in an infinite loop.');
                        }

                        let splitOffset = 0;
                        let remainder = 0;
                        if (element.nodeType === Node.TEXT_NODE) {
                            splitOffset = findTextNodeSplit(
                                element,
                                pageStart,
                                pageTop
                            );
                            let bot = 0;
                            if (splitOffset === 0) {
                                let parent = element.parentNode;

                                while (parent.previousSibling === null) {
                                    parent = parent.parentNode;
                                }

                                console.log(parent.previousSibling);
                                range.selectNodeContents(
                                    parent.previousSibling
                                );
                                bot = range.getBoundingClientRect().bottom;
                                // const idx = element.parentNode.childNodes.indexOf(element);
                                // console.log('IDX', idx);
                                // throw new Error('nope');
                            } else {
                                range.setStart(element, splitOffset - 1);
                                range.setEnd(element, splitOffset - 1);

                                bot = range.getBoundingClientRect().bottom;
                            }
                            range.setStart(element, splitOffset);
                            range.setEnd(element, splitOffset);

                            remainder = // Math.max(
                                pageHeight - (bot - pageTop);
                            //0
                            // );
                            console.log(
                                'Calc Remainder: ',
                                pageHeight,
                                bot,
                                pageTop,
                                range.getBoundingClientRect().top
                            );
                            pageTop = range.getBoundingClientRect().top;
                            // pageTop = bot;
                        } else {
                            console.log(element);
                            splitOffset = 0;
                            let parent = element.parentNode;

                            while (parent.previousSibling === null) {
                                parent = parent.parentNode;
                            }

                            range.selectNodeContents(parent.previousSibling);
                            const bot = range.getBoundingClientRect().bottom;
                            remainder = pageHeight - (bot - pageTop);

                            pageTop = element.getBoundingClientRect().top;
                            // throw new Error('Not yet implemented.');
                        }

                        splitElements.push([
                            path,
                            pageStart,
                            element,
                            splitOffset,
                            remainder
                        ]);
                    }

                    const newBody = iframe.$.contentWindow.document.body;
                    newBody.innerHTML = html;

                    console.log(splitElements);
                    console.log(html);

                    for (const [
                        path,
                        splitY,
                        originalElement,
                        splitOffset,
                        remainder
                    ] of splitElements.reverse()) {
                        const element = getNode(newBody, path);

                        console.log(element, newBody, path);

                        const hr = document.createElement('div');
                        hr.className = 'page-breaker';
                        hr.style.marginTop = `${remainder}px`;
                        console.log(`Remainder: ${remainder}`);

                        if (element.nodeType === Node.TEXT_NODE) {
                            if (splitOffset === 0) {
                                element.parentNode.insertBefore(hr, element);
                            } else {
                                const pre = element.textContent.slice(
                                    0,
                                    splitOffset
                                );
                                const post = element.textContent.slice(
                                    splitOffset
                                );
                                console.log('Full:', element.textContent);
                                console.log('split:', splitOffset);
                                console.log('Pre:', pre);
                                console.log('Post:', post);

                                const preNode = document.createTextNode(pre);
                                const postNode = document.createTextNode(post);
                                preNode.originalNode = originalElement;
                                postNode.trueOffset = pre.length;
                                postNode.originalNode = originalElement;

                                element.parentNode.insertBefore(
                                    preNode,
                                    element
                                );
                                element.parentNode.insertBefore(hr, element);
                                element.parentNode.insertBefore(
                                    postNode,
                                    element
                                );
                                element.parentNode.removeChild(element);
                            }
                        } else if (element.nodeType === Node.ELEMENT_NODE) {
                            console.log(element);
                            element.parentNode.insertBefore(hr, element);
                            // throw new Error("Not yet implemented.")
                        } else {
                            throw new Error('Unsupported node type.');
                        }
                        console.log(element.nodeType);
                    }
                }
            });
        },
        afterInit: function(editor) {}
    });
})();
