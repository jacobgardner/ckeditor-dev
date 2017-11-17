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
        onLoad: function() {
            // console.log(editor.document);
            // var cssStyles = (
            // 		'background:url(' + CKEDITOR.getUrl( this.path + 'images/pagebreak.gif' ) + ') no-repeat center center;' +
            // 		'clear:both;' +
            // 		'width:100%;' +
            // 		'border-top:#999 1px dotted;' +
            // 		'border-bottom:#999 1px dotted;' +
            // 		'padding:0;' +
            // 		'height:7px;' +
            // 		'cursor:default;'
            // 	).replace( /;/g, ' !important;' ); // Increase specificity to override other styles, e.g. block outline.

            // // Add the style that renders our placeholder.
            // CKEDITOR.addCss( 'div.cke_pagebreak{' + cssStyles + '}' );
        },

        init: function(editor) {
            editor.once('instanceReady', () => {
                // editor.document.$;
                console.log('Document:', editor.document.$);
                // editor.document.$.body.style.display = 'none';
                console.log('Document:');

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

                var contentSpace = editor.ui.space('contents');
                document.getElementById('preview').appendChild(iframe.$);

                const editable = editor.editable();
                // console.log(editable);
                console.log(editor.document);
                console.log(editor.document.$.documentElement.innerHTML);
                console.log(iframe.$.contentWindow);
                // console.log("HTML:", editor.document);

                iframe.$.contentWindow.document.documentElement.innerHTML =
                    editor.document.$.documentElement.innerHTML;

                const observer = new MutationObserver(() => {
                    const html = editable.getHtml();

                    iframe.$.contentWindow.document.body.innerHTML = html;
                    // console.log(iframe.$.contentWindow.document.body);

                    // console.log(html);
                });

                // observer.observe(editable.$, {

                // });

                editable.$.addEventListener('input', htmlModified);
                // evt => {
                //     const html = editable.getHtml();

                //     iframe.$.contentWindow.document.body.innerHTML = html;
                //     console.log(iframe.$.contentWindow.document.body);

                //     console.log(html);
                // });

                const range = document.createRange();
				const pageHeight = 170;

				function findSplitElement(root, breakPoint, clientTop, path) {
					if (!root.childNodes.length) {
						return root;
					}

					// console.log(Array.from(root.childNodes).map(n => {range.selectNodeContents(n); return [range.getBoundingClientRect().top - clientTop, range.getBoundingClientRect().bottom - clientTop];}).map(r => `[${r[0]}->${r[1]}]`).join(', '))
					// [3->20], [43->60], [83->100], [123->140], [163->180], [203->220], [243->260], [283->300], [323->340]

					let [lowerBound, upperBound] = [0, root.childNodes.length - 1];

					let current = root.childNodes[0];
					let pivot = 0;
					while (upperBound !== lowerBound) {
						pivot = Math.floor((upperBound + lowerBound) / 2);
						current = root.childNodes[pivot];
						range.selectNodeContents(current);

						const rect = range.getBoundingClientRect();

						if (breakPoint <= rect.top - clientTop) {
							if (upperBound - lowerBound === 1) {
								path.push(pivot)
								return findSplitElement(current, breakPoint, clientTop, path);
							}
							// console.log('<-]');
                            upperBound = pivot;
						} else if (breakPoint >= rect.bottom - clientTop) {
							if (upperBound - lowerBound === 1) {
								path.push(pivot + 1)
								return findSplitElement(root.childNodes[pivot + 1], breakPoint, clientTop, path);
							}
							// console.log('[->');
							lowerBound = pivot;
						} else {
							path.push(pivot);
							return findSplitElement(current, breakPoint, clientTop, path);
						}
					}

					path.push(pivot);
					return findSplitElement(current, breakPoint, clientTop, path);
				}

				function findTextNodeSplit(element, breakPoint, clientTop) {
					const textContent = element.textContent;

					let [lowerBound, upperBound] = [0, textContent.length];

					while (lowerBound !== upperBound) {
						const pivot = Math.floor((upperBound + lowerBound) / 2);

						range.setStart(element, pivot);
						range.setEnd(element, pivot);

						console.log(`Range: [${lowerBound}, ${upperBound}]`)

						const rect = range.getBoundingClientRect();

						if (breakPoint <= rect.top - clientTop) {
							console.log(`<-] ${breakPoint} <= ${rect.top - clientTop}`);
							if (upperBound - lowerBound === 1) {
								return pivot;
							}
							upperBound = pivot;
						} else {
							console.log(`[-> ${breakPoint} > ${rect.top - clientTop}`);
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
					const clientPageTop = root.children[0].getBoundingClientRect().top;
					const splitElements = [];

                    while (1) {
                        pageNumber += 1;
                        const pageStart = pageNumber * pageHeight;

						const path = [];
						const element = findSplitElement(root, pageStart, clientPageTop, path);

						if (!element) {break;}

						range.selectNode(element);

						if (range.getBoundingClientRect().bottom - clientPageTop <= pageStart) {
							break;
						}

						if (pageNumber > 10000) {
							// TODO: Remove for prod.
							throw new Error('Probably in an infinite loop.')
						}

						splitElements.push([path, pageStart])
					}

					const newBody = iframe.$.contentWindow.document.body;
					newBody.innerHTML = html;

					console.log(splitElements);
					console.log(html);

					function getNode(root, path, idx = 0) {
						if (idx < path.length) {
							return getNode(root.childNodes[path[idx]], path, idx + 1);
						} else {
							return root;
						}
					}

					for (const [path, splitY] of splitElements) {
						const element = getNode(newBody, path);

						console.log(element, newBody, path);

						if (element.nodeType === Node.TEXT_NODE) {
							const splitOffset = findTextNodeSplit(element, splitY, clientPageTop);
							console.log('Split Offset:', splitOffset);

							if (splitOffset === 0) {
								element.parentNode.insertBefore(document.createElement('hr'), element);
							} else {
								const pre = element.textContent.slice(0, splitOffset);
								const post = element.textContent.slice(splitOffset);
								console.log('Full:', element.textContent);
								console.log('split:', splitOffset)
								console.log('Pre:', pre);
								console.log('Post:', post);
								element.parentNode.insertBefore(document.createTextNode(pre), element)
								element.parentNode.insertBefore(document.createElement('hr'), element);
								element.parentNode.insertBefore(document.createTextNode(post), element)
								element.parentNode.removeChild(element);
							}

						} else if (element.nodeType === Node.ELEMENT_NODE) {
							console.log(element);
							throw new Error("Not yet implemented.")
						} else {
							throw new Error("Unsupported node type.")
						}
						console.log(element.nodeType);

						// let parent = element;


					}

                    // for (let i = 1; i < pageCount; i += 1) {
                    // 	const pageStart = i * pageHeight;

                    // 	buildOffsetPath()

                    // }

                    // console.log('Full Height:', fullHeight);
                    // console.log();

                    // children[0]

                    // console.log(children)
                    // console.log();

                    // console.log(editor.document.$.body);

                    // iframe.$.contentWindow.document.body.innerHTML =
                    //     html.slice(0, 100) + '<hr />' + html.slice(100);
                }

                // contentSpace.append(iframe);
            });
            // console.log(editor.element.$);
            // editor.document.$.style.display = 'none';
            // if ( editor.blockless )
            // 	return;

            // // Register the command.
            // editor.addCommand( 'pagebreak', CKEDITOR.plugins.pagebreakCmd );

            // // Register the toolbar button.
            // editor.ui.addButton && editor.ui.addButton( 'PageBreak', {
            // 	label: editor.lang.pagebreak.toolbar,
            // 	command: 'pagebreak',
            // 	toolbar: 'insert,70'
            // } );

            // // Webkit based browsers needs help to select the page-break.
            // CKEDITOR.env.webkit && editor.on( 'contentDom', function() {
            // 	editor.document.on( 'click', function( evt ) {
            // 		var target = evt.data.getTarget();
            // 		if ( target.is( 'div' ) && target.hasClass( 'cke_pagebreak' ) )
            // 			editor.getSelection().selectElement( target );
            // 	} );
            // } );
        },
        afterInit: function(editor) {
            // console.log(editor.document);
            // // Register a filter to displaying placeholders after mode change.
            // var dataProcessor = editor.dataProcessor,
            // 	dataFilter = dataProcessor && dataProcessor.dataFilter,
            // 	htmlFilter = dataProcessor && dataProcessor.htmlFilter,
            // 	styleRegex = /page-break-after\s*:\s*always/i,
            // 	childStyleRegex = /display\s*:\s*none/i;

            // function upcastPageBreak( element ) {
            // 	CKEDITOR.tools.extend( element.attributes, attributesSet( editor.lang.pagebreak.alt ), true );

            // 	element.children.length = 0;
            // }

            // if ( htmlFilter ) {
            // 	htmlFilter.addRules( {
            // 		attributes: {
            // 			'class': function( value, element ) {
            // 				var className = value.replace( 'cke_pagebreak', '' );
            // 				if ( className != value ) {
            // 					var span = CKEDITOR.htmlParser.fragment.fromHtml( '<span style="display: none;">&nbsp;</span>' ).children[ 0 ];
            // 					element.children.length = 0;
            // 					element.add( span );
            // 					var attrs = element.attributes;
            // 					delete attrs[ 'aria-label' ];
            // 					delete attrs.contenteditable;
            // 					delete attrs.title;
            // 				}
            // 				return className;
            // 			}
            // 		}
            // 	}, { applyToAll: true, priority: 5 } );
            // }

            // if ( dataFilter ) {
            // 	dataFilter.addRules( {
            // 		elements: {
            // 			div: function( element ) {
            // 				// The "internal form" of a pagebreak is pasted from clipboard.
            // 				// ACF may have distorted the HTML because "internal form" is
            // 				// different than "data form". Make sure that element remains valid
            // 				// by re-upcasting it (https://dev.ckeditor.com/ticket/11133).
            // 				if ( element.attributes[ 'data-cke-pagebreak' ] )
            // 					upcastPageBreak( element );

            // 				// Check for "data form" of the pagebreak. If both element and
            // 				// descendants match, convert them to internal form.
            // 				else if ( styleRegex.test( element.attributes.style ) ) {
            // 					var child = element.children[ 0 ];

            // 					if ( child && child.name == 'span' && childStyleRegex.test( child.attributes.style ) )
            // 						upcastPageBreak( element );
            // 				}
            // 			}
            // 		}
            // 	} );
            // }
        }
    });
})();
