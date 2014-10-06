jQuery(function($){

	"use strict";

	// Options
	var sil_options = window.sil_options || {

		// CSS Selector for images to affect (jQuery)
		selector: 'img',

		// Clean up DOM after source is inserted (the noscript tag). This is just cosmetics, turn off if performance is critical
		cleanup: true,

		// Override iOS DOM manipulation blockage while scrolling for instant image draw
		responsive_touch: true,

		// Emulate scroll inertia for iOS ( only needed if previous option is set )
		emulate_inertia: true,

		// Emulate rubberbanding scroll effect for iOS ( only needed if previous option is set )
		emulate_rubberband: true,

		// Threshold distance from actual visibility to insert the source (in pixels)
		meat: 100,

		// update the images position data on resize event. You can also refresh manually in your script with sil_refresh().
		refresh_resize: true,

		// update the images position data on resize event. You can also refresh manually in your script with sil_refresh().
		refresh_scroll: false,

		// Check the images' actual visibility in addition to their position relative to the viewport.
		enhanced_accuracy: false,

		// Maximum screen width where to switch from priority to lazy loading. Set to 0 for no lazy loading
		lazy_load_at: 1024,

		// Fade in lazy loaded images. Fancy.
		fade: false,

		// Value of empty image source.
		placeholder: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
	};

	var d = document,
		w = window,
		$document = $(d),
		$wrapping_image,
		$wrapped_images,
		$html_body,
		$noscripts,
		host,

		window_width,
		window_height,
		doc_height,
		scroll_top,
		scroll_left,

		prev_x,
		prev_y,
		touching,
		scrolldistance,
		scrolldistanceX,
		scrolldistanceY,
		inertia,
		rubberbanding,
		all_loaded,

		scroll_event,
		scroll_event_last,
		move_event,
		move_event_last,
		resize_event,
		resize_event_last,


		iOS = /(iPad|iPhone|iPod)/g.test( navigator.userAgent ),
		lazyload = !!( w.matchMedia && w.matchMedia('(max-device-width: '+sil_options.lazy_load_at+'px)').matches ),



	// HELPER
	//////////////////////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////////////

	viewport = function()
	{

		var e = w,
			a = 'inner';
		if ( !( 'innerWidth' in w ) )
		{
			a = 'client';
			e = d.documentElement || d.body;
		}
		return { width : e[ a+'Width' ] , height : e[ a+'Height' ]};

	},


	getStyle = function(el, property)
	{
		if ( window.getComputedStyle )
		{
			return document.defaultView.getComputedStyle(el,null)[property];
		}
		if ( el.currentStyle )
		{
			return el.currentStyle[property];
		}
	},


	scrolled = function()
	{

		return scroll_event_last !== scroll_event;

	},


	moved = function()
	{

		return move_event_last !== move_event;

	},


	resized = function()
	{

		return resize_event_last !== resize_event;

	},


	is_visible = function(v)
	{

		var element,
			$element,
			element_offset_top,
			element_offset_left,
			element_width,
			element_height,
			is_not_above_screen,
			is_not_below_screen,
			is_not_right_of_screen,
			is_not_left_of_screen,
			is_not_hidden;

		if ( v.nodeType && v.nodeType == 1 )
			element = v;

		else if ( this.nodeType && this.nodeType == 1 )
			element = this;

		$element = $(element);

		element_offset_top     = $element.data('offsetTop');
		element_offset_left    = $element.data('offsetLeft');
		element_width          = $element.data('width');
		element_height         = $element.data('height');
		element_visibile       = $element.data('visibility');

		is_not_above_screen    = element_offset_top + element_height > scroll_top - sil_options.meat;
		is_not_left_of_screen  = element_offset_left + element_width > scroll_left - sil_options.meat;
		is_not_below_screen    = element_offset_top < scroll_top + window_height + sil_options.meat;
		is_not_right_of_screen = element_offset_left < scroll_left + window_width + sil_options.meat;


		return is_not_above_screen && is_not_left_of_screen && is_not_below_screen && is_not_right_of_screen && element_visibile;

	},


	source_not_set = function(v)
	{

		var element, src;

		if ( v.nodeType && v.nodeType == 1 )
			element = v;

		else if ( this.nodeType && this.nodeType == 1 )
			element = this;

		src = $(element).attr('src');

		// for browsers which still have the empty request bug we include the latter
		return src == sil_options.placeholder || src == host;

	},


	refresh_data = function( $elements, update_view )
	{

		$elements = $elements || $wrapped_images || $('body').find('noscript').prev( sil_options.selector );

		$elements.each( function(){

			var $this = $(this);

			$this.data({
				offsetTop:  $this.offset().top,
				offsetLeft: $this.offset().left,
				width:      $this.width(),
				height:     $this.height(),
				visibility: getStyle(this, 'display') != "none" && getStyle(this, 'visibility') != "hidden" && getStyle(this, 'opacity') != "0"
			});

		});

		doc_height = $(d).height();

		if ( update_view )
		{
			var callback = lazyload ? null : load_all_images;

			load_visible_images( callback, true );
		}

	},


	emulate_scroll_inertia = function()
	{

		var scrolledBottom,
			scrolledTop,
			scrolledEnd;

		w.scrollBy( 0, Math.floor(scrolldistanceY/2) );

		scrolldistanceY *= 0.95;
		scrolledBottom = doc_height <= window_height + scroll_top + 1;
		scrolledTop    = (scroll_top === 0);
		scrolledEnd    = scrolledBottom || scrolledTop;

		inertia = false;

		if ( Math.abs(scrolldistanceY) > 2 && !touching && !scrolledEnd )
			inertia = true;

		else if ( scrolledEnd && sil_options.emulate_rubberband )
			emulate_rubberband( scrolldistanceY );

	},


	emulate_rubberband = function( scrolldistanceY )
	{

		rubberbanding = scrolldistanceY;

		var
		scroll_dir  = scrolldistanceY < 0 ? 1 : -1,
		band_length = Math.min( Math.abs(scrolldistanceY), w.innerHeight/10 ) * scroll_dir,
		duration_ms = Math.abs( scrolldistanceY*3 );

		duration_ms = Math.min( duration_ms, 200 );
		duration_ms = Math.max( duration_ms, 125 );

		d.body.style.webkitTransition           = 'all ' + duration_ms / 1000 * 0.5 + 's cubic-bezier(0.3, 0.6, 0.6, 1)';
		d.documentElement.style.backgroundColor = 'lightgrey';

		w.requestAnimationFrame( function(){
			d.body.style.webkitTransform = 'translate3d(0px, ' + band_length + 'px, 0px)';
		});

		// halfway callback
		w.setTimeout( function(){

			d.body.style.webkitTransition = 'all ' + duration_ms / 1000 * 2 + 's cubic-bezier(0.5, 0.03, 0.5, 1)';

			w.requestAnimationFrame( function(){
				d.body.style.webkitTransform  = 'translate3d(0px, 0px, 0px)';
			});
		},
		duration_ms * 0.5 );

		// complete callback
		w.setTimeout( function(){

			d.body.style.webkitTransform  = '';
			d.body.style.webkitTransition = '';
			d.documentElement.style.backgroundColor = '';

			rubberbanding = false;
		},
		duration_ms * 2.5 );

	},




	// IMAGE LOADING
	//////////////////////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////////////

	load_image = function( wrapping_image, on_load_callback, fade )
	{

		$wrapping_image = $(wrapping_image);

		var
		classId   = $wrapping_image.attr('data-sil'),
		$noscript = $noscripts.filter( '[data-sil="' + classId + '"]');


		if ( typeof on_load_callback == 'function' )
			$wrapping_image.on( 'load', on_load_callback );


		if ( sil_options.fade && fade )
		{
			$wrapping_image.data({ opacity: $wrapping_image.css('opacity') }).css({ opacity: '0' });

			$wrapping_image.on( 'load', function(){

				$(this).fadeTo( 500, $(this).data('opacity') );
			});
		}

		$wrapping_image.attr( 'src', $noscript.attr('title') );

		requestAnimationFrame(function () {
			refresh_data( $wrapped_images, true );
		});

		if ( sil_options.cleanup )
		{
			$noscript.remove();
		}

	},


	load_visible_images = function( on_all_visible_load_callback, fade )
	{

		var $visible_images = $wrapped_images.filter( is_visible ),
			images_to_load  = $visible_images.length,
			images_loaded   = 0;

		if ( images_to_load === 0 && typeof on_all_visible_load_callback == 'function' )
		{
			on_all_visible_load_callback();
		}
		else
		{
			$visible_images.each( function(i, image){

				// trigger image loading
				load_image( image, function(e){

					on_image_load(e);

					images_loaded = i+1;

					if ( images_loaded == images_to_load && typeof on_all_visible_load_callback == 'function' )
					{
						on_all_visible_load_callback();
					}

				}, fade );

				// remove load triggered image from object
				$wrapped_images = $wrapped_images.map( function(){

					if ( this !== image ) return this;
				});
			});
		}


	},


	load_all_images = function()
	{

		$wrapped_images.each( function(){

			var image = this;

			// trigger image loading
			load_image( image, on_image_load );

			// remove load triggered image from object
			$wrapped_images = $wrapped_images.map( function(){

				if ( this !== image  ) return this;
			});
		});

	},






	// EVENT HANDLING
	//////////////////////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////////////


	on_image_load = function( e )
	{

		all_loaded = $wrapped_images.length > 0 ? false : true;

		if ( all_loaded )
		{
			$document.trigger('sil_load');
		}

	},


	on_user_refresh = function()
	{

		refresh_data( $wrapped_images, true );

	},


	on_touch_move = function(e)
	{

		e.preventDefault();

		move_event = e;

	},


	on_touch_start = function()
	{

		scrolldistanceX = 0;
		scrolldistanceY = 0;

		prev_x = false;
		prev_y = false;

		touching = true;

		inertia = false;

	},


	on_touch_end = function()
	{

		prev_x = false;
		prev_y = false;

		touching = false;

		if ( sil_options.emulate_inertia )
			inertia = true;

	},


	on_document_scroll = function(e)
	{

		scroll_event = e;

	},


	on_window_resize = function(e)
	{

		resize_event = e;

	},


	on_document_ready = function()
	{

		if ( !iOS )
			window.requestAnimationFrame( init );

	},


	on_window_load = function()
	{

		doc_height = $document.height();

		if ( iOS )
			w.requestAnimationFrame( init );

	},


	register_events = function()
	{

		$(w).on('resize', on_window_resize);
		$(w).on('load',   on_window_load);
		$document.on('scroll', on_document_scroll);

		if ( sil_options.responsive_touch && iOS )
		{
			$document.on('touchmove',  on_touch_move);
			$document.on('touchend',   on_touch_end);
			$document.on('touchstart', on_touch_start);
		}

		$document.ready( on_document_ready );
	},


	unregister_events = function()
	{

		$(w).off('resize', on_window_resize);
		$document.off('scroll', on_document_scroll);

		if ( sil_options.responsive_touch && iOS )
		{
			$document.off('touchmove',  on_touch_move);
			$document.off('touchend',   on_touch_end);
			$document.off('touchstart', on_touch_start);
		}

	},



	// MAIN
	//////////////////////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////////////

	render = function( frame )
	{

		if ( scrolled() )
		{
			scroll_top  = $document.scrollTop();
			scroll_left = $document.scrollLeft();

			if ( sil_options.refresh_scroll )
				refresh_data( $wrapped_images );

			if ( lazyload )
				load_visible_images( null, true );

			scroll_event_last = scroll_event;
		}


		if ( moved() )
		{
			var currentX = move_event.originalEvent.layerX - scroll_left;
			var currentY = move_event.originalEvent.layerY - scroll_top;

			scrolldistanceX = scrolldistanceY = 0;

			if ( prev_x && prev_x !== currentX )
			{
				scrolldistanceX = prev_x - currentX;
			}
			if ( prev_y && prev_y !== currentY )
			{
				scrolldistanceY = prev_y - currentY;
			}

			prev_x = currentX;
			prev_y = currentY;

			w.scrollBy( scrolldistanceX, scrolldistanceY );

			move_event_last = move_event;
		}


		if ( resized() )
		{
			window_width = viewport().width;
			window_height = viewport().height;

			refresh_data( $wrapped_images );

			if ( sil_options.refresh_resize )
				refresh_data( $wrapped_images );

			if ( lazyload )
				load_visible_images( null, true );

			resize_event_last = resize_event;
		}


		if ( inertia )
			emulate_scroll_inertia();


		if ( !all_loaded || inertia || rubberbanding )
			w.requestAnimationFrame( render );

		else
			unregister_events();

	},


	init = function()
	{

		$html_body         = $('html, body');
		$noscripts         = $('body').find('noscript[data-sil]');
		$wrapped_images    = $(sil_options.selector + '[data-sil]');
		window_width       = viewport().width;
		window_height      = viewport().height;
		host               = d.location.protocol + '//' + d.location.host + '/';
		scroll_top         = $document.scrollTop();
		scroll_left        = $document.scrollLeft();
		doc_height         = $document.height();
		inertia            = false;
		rubberbanding      = false;
		all_loaded         = $wrapped_images.length > 0 ? false : true;
		window.sil_refresh = on_user_refresh;

		refresh_data( $wrapped_images );

		if ( lazyload )
			load_visible_images();
		else
			load_visible_images( load_all_images );

		render();

	};

	rf_poly();
	register_events();


});


// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating

// requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel

// MIT license

function rf_poly() {
	var lastTime = 0;
	var vendors = ['webkit', 'moz'];
	for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
		window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
		window.cancelAnimationFrame =
		  window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
	}

	if (!window.requestAnimationFrame)
		window.requestAnimationFrame = function(callback, element) {
			var currTime = new Date().getTime();
			var timeToCall = Math.max(0, 16 - (currTime - lastTime));
			var id = window.setTimeout(function() { callback(currTime + timeToCall); },
			  timeToCall);
			lastTime = currTime + timeToCall;
			return id;
		};

	if (!window.cancelAnimationFrame)
		window.cancelAnimationFrame = function(id) {
			clearTimeout(id);
		};
};

