# LUMI LIVING compact design system

`src/app/design-tokens.css` owns the shared color, typography, spacing, control,
card radius and motion values. Existing compact page styles consume those tokens;
hero geometry, collection banners and navigation dropdowns keep their owners.

`FurnitureProductCard` is the single card used by homepage grids and carousels,
collection grids, related products, room hotspots and the wishlist. Parent
containers own columns and carousel widths, not card styling.

Names and prices share one row. A reserved metadata row reveals the walnut cart
button on hover or keyboard/touch focus, without shifting neighboring cards.
The existing wishlist, photo gallery, cart storage and enquiry drawer are reused.
Small thumbnails appear only for multiple photos. Editing mode exposes the
remaining description, badge and link-label fields without changing product data.

Keep photo frames and card typography consistent by changing tokens, rather than
adding separate page-specific card rules. Do not use the retired collection card
styles or legacy `lumi-product-card` and `lr-product-card` classes for new cards.
