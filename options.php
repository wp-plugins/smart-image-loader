
<div class="wrap">
<h2>Smart Image Loader</h2>

<form method="post" action="options.php">
	<?php settings_fields( 'sil-settings-group' ); ?>
	<?php do_settings_sections( 'sil-settings-group' ); ?>
	<table class="form-table ">
		<tr valign="top">
		<th scope="row">CSS Selector</th>
		<td><input type="text" name="sil-selector" value="<?php echo get_option('sil-selector', 'img'); ?>" /><br/>(jQuery) CSS Selector for images to affect. Use a class if you want to affect only certain images.</td>
		</tr>

		<tr valign="top">
		<th scope="row">CSS Exclude Class</th>
		<td><input type="text" name="sil-exclude" value="<?php echo get_option('sil-exclude', 'not-smart'); ?>" /><br/>Images with this class will be excluded. Overrides the include selector ( useful if your include selector is 'img' ). Comma separated if multiple.</td>
		</tr>

		<tr valign="top">
		<th scope="row">Do clean up</th>
		<td><input type="checkbox" name="sil-cleanup" value="true" <?php checked( "true" == get_option('sil-cleanup') ) ?> />Clean up DOM (the noscript tag) after the image source has been inserted. This is just cosmetics basically, turn off if performance is critical.</td>
		</tr>

		<tr valign="top">
		<th scope="row">Visible threshold</th>
		<td><input type="number" name="sil-meat" value="<?php echo get_option('sil-meat', '100'); ?>" /><br/>Threshold distance from actual visibility to insert the source (in pixels).</td>
		</tr>

		<tr valign="top">
		<th scope="row">Always refresh</th>
		<td><input type="checkbox" name="sil-refresh" value="true" <?php checked( "true" == get_option('sil-refresh') ) ?> />Update the images position data on scroll and resize event. Useful if your site's layout changes dynamically. You can also refresh manually in your script with sil_refresh().</td>
		</tr>

		<tr valign="top">
		<th scope="row">Lazy load at</th>
		<td><input type="number" name="sil-lazy-load-at" value="<?php echo get_option('sil-lazy-load-at', '0'); ?>" /><br/>Specify a maximum screen width where to switch from priority to lazy loading, assuming small screen devices tend to run on bandwidth critical connections. Set to 0 to disable.</td>
		</tr>

		<tr valign="top">
		<th scope="row">Fade effect</th>
		<td><input type="checkbox" name="sil-fade" value="true" <?php checked( "true" == get_option('sil-fade') ) ?>/>Fade in lazy loaded images. Fancy.</td>
		</tr>
	</table>


	<table class="form-table postbox">
		<thead><h3>iOS Hacks</h3></thead>
		<tr valign="top" >
		<th style="padding-left: 1em;" scope="row">Instant image draw</th>
		<td style="padding-left: 1em;"><input type="checkbox" name="sil-responsive-touch" value="true" <?php checked( "true" == get_option('sil-responsive-touch') ) ?>/>Override DOM manipulation blockage while scrolling. Turn off if performance is critical.</td>
		</tr>

		<tr valign="top" style="padding-left: 1em;">
		<th style="padding-left: 1em;" scope="row">Scroll inertia</th>
		<td style="padding-left: 1em;"><input type="checkbox" name="sil-emulate-inertia" value="true" <?php checked( "true" == get_option('sil-emulate-inertia') ) ?>/>Emulate scroll inertia effect ( only needed if previous option is set )</td>
		</tr>

		<tr valign="top" style="padding-left: 1em;">
		<th style="padding-left: 1em;" scope="row">Rubberbanding</th>
		<td style="padding-left: 1em;"><input type="checkbox" name="sil-emulate-rubberband" value="true" <?php checked( "true" == get_option('sil-emulate-rubberband') ) ?>/>Emulate rubberbanding scroll effect ( only needed if previous option is set )</td>
		</tr>
	</table>
	<table class="form-table postbox">
		<tr valign="top" style="padding-left: 1em;">
			<h3>Advanced</h3>
			<th style="padding-left: 1em;" scope="row">Source placeholder</th>
			<td style="padding-left: 1em;"><input type="text" name="sil-placeholder" value="<?php echo get_option('sil-placeholder', ''); ?>" /><br/>Value of empty image source.</td>
		</tr>
	</table>

	<?php submit_button(); ?>

</form>
</div>