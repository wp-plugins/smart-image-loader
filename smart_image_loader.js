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

		// update the images position data on scroll and resize event. Useful if your site's layout changes dynamically. You can also refresh manually in your script with sil_refresh().
		always_refresh: false,

		// Maximum screen width where to switch from priority to lazy loading. Set to 0 for no lazy loading
		lazy_load_at: 1024,

		// Fade in lazy loaded images. Fancy.
		fade: false,

		// Value of empty image source.
		placeholder: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
	};

	var d = document,
		w = window,
		$wrapping_image,
		$wrapped_images,
		$html_body,
		noscripts,
		host,

		window_height,
		doc_height,
		scroll_top,

		prev_y,
		touching,
		scrolldistance,
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
			element_offset_top,
			element_height,
			is_not_above_top,
			is_not_below_the_fold;

		if ( v.nodeType && v.nodeType == 1 )
			element = v;

		else if ( this.nodeType && this.nodeType == 1 )
			element = this;


		element_offset_top    = $(element).data('offsetTop');
		element_height        = $(element).data('height');

		is_not_above_top      = element_offset_top + element_height > scroll_top - sil_options.meat;
		is_not_below_the_fold = element_offset_top < scroll_top + window_height + sil_options.meat;

		return is_not_above_top && is_not_below_the_fold;

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

			$(this).data({
				offsetTop: $(this).offset().top,
				height:    $(this).height()
			});
		});


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

		w.scrollBy( 0, Math.floor(scrolldistance/2) );

		scrolldistance *= 0.95;
		scrolledBottom = doc_height <= window_height + scroll_top + 1;
		scrolledTop    = (scroll_top === 0);
		scrolledEnd    = scrolledBottom || scrolledTop;

		inertia = false;

		if ( Math.abs(scrolldistance) > 2 && !touching && !scrolledEnd )
			inertia = true;

		else if ( scrolledEnd && sil_options.emulate_rubberband )
			emulate_rubberband( scrolldistance );

	},


	emulate_rubberband = function( scrolldistance )
	{

		rubberbanding = scrolldistance;

		var duration_ms =  Math.min( Math.abs(scrolldistance*3), 300 );

		var backgroundElement = $("<div></div>").css(
		{
			backgroundColor: 'lightgray',
			webkitTransition: 'height ' + duration_ms / 1000 * 0.5 + 's cubic-bezier(0.3, 0.6, 0.6, 1)',
			mozTransition:    'height ' + duration_ms / 1000 * 0.5 + 's cubic-bezier(0.3, 0.6, 0.6, 1)',
			oTransition:      'height ' + duration_ms / 1000 * 0.5 + 's cubic-bezier(0.3, 0.6, 0.6, 1)',
			transition:       'height ' + duration_ms / 1000 * 0.5 + 's cubic-bezier(0.3, 0.6, 0.6, 1)'
		});

		if ( scrolldistance < 0 )
			$("body").prepend( backgroundElement );

		else if ( scrolldistance > 0 )
			$("body").append( backgroundElement );

		backgroundElement.css({
			height: Math.abs(scrolldistance)+'px'
		});

		w.setTimeout( function(){

			backgroundElement.css({
				height: '0px',
				webkitTransition: 'height ' + duration_ms / 1000 * 2 + 's cubic-bezier(0.5, 0.03, 0.5, 1)',
				mozTransition:    'height ' + duration_ms / 1000 * 2 + 's cubic-bezier(0.5, 0.03, 0.5, 1)',
				oTransition:      'height ' + duration_ms / 1000 * 2 + 's cubic-bezier(0.5, 0.03, 0.5, 1)',
				transition:       'height ' + duration_ms / 1000 * 2 + 's cubic-bezier(0.5, 0.03, 0.5, 1)'
			});
		},
		duration_ms * 0.5 );

		w.setTimeout( function(){

			rubberbanding = false;
			backgroundElement.remove();
		},
		duration_ms * 2.5 );

	},




	// IMAGE LOADING
	//////////////////////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////////////

	load_image = function( wrapping_image, on_load_callback, fade )
	{
		$wrapping_image = $(wrapping_image);

		noscripts.each( function( i, el )
		{
			var noscript = $( el );

			if ( noscript.prev().get(0) == wrapping_image )
			{

				if ( typeof on_load_callback == 'function' )
					$wrapping_image.on( 'load', on_load_callback );


				if ( sil_options.fade && fade )
				{
					$wrapping_image.data({ opacity: $wrapping_image.css('opacity') }).css({ opacity: '0' });

					$wrapping_image.on( 'load', function(){

						$(this).fadeTo( 500, $(this).data('opacity') );
					});
				}

				$wrapping_image.attr( 'src', noscript.attr('alt') );

				doc_height = $(d).height();

				if ( sil_options.cleanup )
				{
					noscript.remove();
				}
			}
		});

	},


	load_visible_images = function( on_all_visible_load_callback, fade )
	{

		var $visible_images = $wrapped_images.filter( is_visible ),
			images_to_load  = $visible_images.length,
			images_loaded   = 0;

		$visible_images.each( function(i, el){

			load_image( el, function(){

				images_loaded = i+1;

				if ( images_loaded == images_to_load )
				{
					on_all_visible_loaded( on_all_visible_load_callback );
				}

			}, fade );

			refresh_data( $wrapped_images );
		});

		if ( images_to_load === 0 )
			on_all_visible_loaded( on_all_visible_load_callback );

	},


	load_all_images = function()
	{

		$wrapped_images.each( function(){
			load_image( this );
		});

	},




	// EVENT HANDLING
	//////////////////////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////////////


	on_all_visible_loaded = function( on_all_visible_load_callback )
	{
		// remove loaded images from object
		$wrapped_images = $wrapped_images.filter( source_not_set );

		all_loaded = $wrapped_images.length > 0 ? false : true;

		if ( typeof on_all_visible_load_callback == 'function' )
		{
			on_all_visible_load_callback();
		}

		if ( all_loaded )
		{
			$(d).trigger('sil_load');
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

		scrolldistance = 0;
		prev_y = false;

		touching = true;

		inertia = false;

	},


	on_touch_end = function()
	{

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

		doc_height = $(d).height();

		if ( iOS )
			w.requestAnimationFrame( init );

	},


	register_events = function()
	{

		$(w).on('resize', on_window_resize);
		$(w).on('load',   on_window_load);
		$(d).on('scroll', on_document_scroll);

		if ( sil_options.responsive_touch && iOS )
		{
			$(d).on('touchmove',  on_touch_move);
			$(d).on('touchend',   on_touch_end);
			$(d).on('touchstart', on_touch_start);
		}

		$(d).ready( on_document_ready );
	},


	unregister_events = function()
	{

		$(w).off('resize', on_window_resize);
		$(d).off('scroll', on_document_scroll);

		if ( sil_options.responsive_touch && iOS )
		{
			$(d).off('touchmove',  on_touch_move);
			$(d).off('touchend',   on_touch_end);
			$(d).off('touchstart', on_touch_start);
		}

	},



	// MAIN
	//////////////////////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////////////

	render = function()
	{

		if ( scrolled() )
		{
			scroll_top = $(d).scrollTop();

			if ( lazyload )
				load_visible_images( null, true );

			if ( sil_options.always_refresh )
				refresh_data( $wrapped_images );

			scroll_event_last = scroll_event;
		}


		if ( moved() )
		{
			var currentY = move_event.originalEvent.layerY - scroll_top;

			if ( prev_y && prev_y !== currentY )
			{
				scrolldistance = prev_y - currentY;

				w.scrollBy( 0, scrolldistance );
			}

			prev_y = currentY;

			move_event_last   = move_event;
		}


		if ( resized() )
		{
			window_height = viewport().height;

			refresh_data( $wrapped_images );

			if ( lazyload )
				load_visible_images( null, true );

			if ( sil_options.always_refresh )
				refresh_data( $wrapped_images );

			resize_event_last = resize_event;
		}


		if ( inertia )
			emulate_scroll_inertia();


		if ( rubberbanding )
		{
			if ( rubberbanding < 0 )
				$html_body.scrollTop( 0 );

			else if ( rubberbanding > 0 )
				$html_body.scrollTop( doc_height + 1000 );
		}

		if ( !all_loaded || inertia || rubberbanding )
			w.requestAnimationFrame( render );

		else
			unregister_events();

	},


	init = function()
	{

		$html_body         = $('html, body');
		noscripts          = $('body').find('noscript');
		$wrapped_images    = noscripts.prev(sil_options.selector);
		window_height       = viewport().height;
		host               = d.location.protocol + '//' + d.location.host + '/';
		scroll_top          = $(d).scrollTop();
		doc_height          = $(d).height();
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

