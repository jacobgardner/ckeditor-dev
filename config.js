/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/terms-of-use/#open-source-licences
 */

CKEDITOR.editorConfig = function(config) {
    // Define changes to default configuration here. For example:
    // config.language = 'fr';
    // config.uiColor = '#AADC6E';
    // %REMOVE_START%
    config.plugins =
        'about,' +
        'a11yhelp,' +
        'basicstyles,' +
        'bidi,' +
        'blockquote,' +
        'clipboard,' +
        'colorbutton,' +
        'colordialog,' +
        'copyformatting,' +
        'contextmenu,' +
        'dialogadvtab,' +
        'div,' +
        'elementspath,' +
        'enterkey,' +
        'entities,' +
        'filebrowser,' +
        'find,' +
        'flash,' +
        'floatingspace,' +
        'font,' +
        'format,' +
        'forms,' +
        'horizontalrule,' +
        'htmlwriter,' +
        'image,' +
        'iframe,' +
        'indentlist,' +
        'indentblock,' +
        'justify,' +
        'language,' +
        'link,' +
        'list,' +
        'liststyle,' +
        'magicline,' +
        'maximize,' +
		'newpage,' +
        'pagebreak,' +
        'pastefromword,' +
        'pastetext,' +
        'preview,' +
        'print,' +
        'removeformat,' +
        'resize,' +
        'save,' +
        'selectall,' +
        'showblocks,' +
        'showborders,' +
        'smiley,' +
        'sourcearea,' +
        'specialchar,' +
        'stylescombo,' +
        'tab,' +
        'table,' +
        'tableselection,' +
        'tabletools,' +
        'templates,' +
        'toolbar,' +
        'undo,' +
        'wysiwygarea';
	// %REMOVE_END%

	config.extraPlugins = 'paginate';

    config.toolbarGroups = [
        { name: 'document', groups: ['mode', 'document', 'doctools'] },
        { name: 'clipboard', groups: ['clipboard', 'undo'] },
        {
            name: 'editing',
            groups: ['find', 'selection', 'spellchecker', 'editing']
        },
        { name: 'forms', groups: ['forms'] },
        { name: 'basicstyles', groups: ['basicstyles', 'cleanup'] },
        {
            name: 'paragraph',
            groups: ['list', 'indent', 'blocks', 'align', 'bidi', 'paragraph']
        },
        { name: 'links', groups: ['links'] },
        { name: 'insert', groups: ['insert'] },
        { name: 'styles', groups: ['styles'] },
        { name: 'colors', groups: ['colors'] },
        { name: 'tools', groups: ['tools'] },
        { name: 'others', groups: ['others'] },
        { name: 'about', groups: ['about'] }
    ];

    config.removeButtons =
        'Source,Save,Templates,Cut,Undo,Find,SelectAll,Form,CopyFormatting,NumberedList,Blockquote,JustifyLeft,BidiLtr,Link,Image,TextColor,About,Format,Flash,Unlink,JustifyCenter,BidiRtl,CreateDiv,BulletedList,Subscript,Superscript,JustifyRight,Language,Anchor,Table,HorizontalRule,JustifyBlock,Smiley,SpecialChar,PageBreak,Iframe,Replace,Redo,Copy,Checkbox,Radio,TextField,Textarea,Select,Button,ImageButton,HiddenField,Paste,PasteText,PasteFromWord,Print,Preview,NewPage,ShowBlocks,BGColor,Font,Styles';
};

// %LEAVE_UNMINIFIED% %REMOVE_LINE%
