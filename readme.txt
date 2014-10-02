=== Smart Image Loader ===
Contributors:
Donate link:
Tags: performance, speed, lazy loading, image, above the fold
Requires at least: 3.8.3
Tested up to: 4.0
Stable tag: 0.3.1
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

Smart Image Loader is a fire-and-forget priority and lazy loader for image sources. Can be a huge performance boost especially for one pagers.


== Description ==

Smart Image Loader loads images which are visible in the initial viewport of your website before any images whose position is "below the fold", outside the current viewport. Those images can be loaded as soon as the visible images are finished loading or "lazy loaded" just when (or before) they would become visible. This can be useful for bandwidth saving on mobile devices.

**There is no need to insert any additional code into your website, just install the plug-in.**

The default settings are fine in most cases, but you may want to adjust them for optimization.

Smart Image Loader is tested and works down to Internet Explorer 7, disabled below.

Features responsive lazy loading on iOS devices (bypassing the scrolling script blockage) and checking for actual visibility.

Note: there is currently no support for (CSS) background images.


== Installation ==

1. Unzip and upload the contents to your `/wp-content/plugins/` directory
2. Activate the plugin through the 'Plugins' menu in WordPress


== Changelog ==

= 0.3.1 =
* added fancy tag word

= 0.3.0 =
* enhanced accuracy option (checking actual visibility in addition to viewport relative position)
* splitted refresh option into resize and scroll event
* performance tweaks
* tested with WordPress 4.0

= 0.2.3 =
* using title instead of alt attribute for the sake of w3c conformity

= 0.2.2 =
* switched to css transform for the rubberbanding effect emulation
* more accurate image load handling

= 0.2.1 =
* first release


