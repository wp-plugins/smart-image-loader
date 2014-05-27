=== Smart Image Loader ===
Contributors:
Donate link:
Tags: performance, speed, lazy loading, image
Requires at least: 3.8.3
Tested up to: 3.9
Stable tag: 0.2.3
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

Smart Image Loader is a fire-and-forget priority and lazy loader for image sources. Can be a huge performance boost especially for one pagers.


== Description ==

Smart Image Loader will let images which are visible when loading the website load before any images whose position is outside the current viewport, so what you see first loads fast while the rest continues downloading after that in the background. Depending on the settings the hidden images can be loaded as soon as the visible images are loaded or "lazy loaded" just when the user scrolls the page to their position. This can be useful for bandwidth saving on mobile devices.

**There is no need to insert any additional code into your website, just install the plug-in.**

The default settings are fine in most cases, but you may want to adjust them for optimization.

Smart Image Loader is tested and works down to Internet Explorer 7, disabled below.

Features responsive lazy loading on iOS devices (bypassing the scrolling script blockage).

Note: there is currently no support for horizontal visibility evaluation or (CSS) background images.


== Installation ==

1. Unzip and upload the contents to your `/wp-content/plugins/` directory
2. Activate the plugin through the 'Plugins' menu in WordPress


== Changelog ==

= 0.2.3 =
* using title instead of alt attribute for the sake of w3c conformity

= 0.2.2 =
* switched to css transform for the rubberbanding effect emulation
* more accurate image load handling

= 0.2.1 =
* first release


