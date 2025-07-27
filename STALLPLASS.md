What is Stallplass.no?

Stallplass.no is a platform where stable owners can advertise the boxes that they have available and service provider can advertise their services.

Lets go over how the whole things works.

1. Login
   1. User can login via email and password. We use supabase Auth for this. There are some protected routes in the app like /dashboard.
2. Home
   1. This is the landing page for the app. If you visit stallplass.no this is what you see. Its the first impression a user gets of our service. It has a search field. Searcing her should redirect the user to our /staller page with a location filter set. The search field on the homepage should be an municipality and county search with autofill. WHen redirected to /stall the same location will be prefilled in the search there.
3. Staller
   1. This is the page where users can filter and find what they are looking for. They can search for staller or boxes. They have alot of filtering options here that make it easy to find just the right thing. All stables are listed in the search results for stables but only boxes with the isAdvertised=true will be listed. A box also has the field isAvailable, this field controlles whether a stable owner has set this box to rented out or not. If a box has isAdvertised=true it should show up in search even if its is isAvailable=false if the users ticks "Show rented out boxes" in the filter option.
   Clicking a stable will take the user to the public stable page. 
   Clicking a box will take the user to the public box page, witch also can be accessed from the public stable page. A box can have isSponsored=true, then it will show up at the top in search results. The box card will then also have a little pill saying that it is a sponsored result.
4. Stable public page
   1. A stable have a public page, a page that all users can access. This show the info of the stable, pictures, descritions, ameneties etc. It also lists all the boxes that have isAdvertised=true. It also lists the boxes that have isAvailable=false, but they will be marked with a pill "Not available". This is so that when a user access the stable they can see all they have to offer. The main thing is that the isAdvertisted HAS to be true for a box to show up.
   The page also has a map showing where the stable is.
   At the very bottom services that are in the same area as the stable will be listed.
5. Box public page
   1. This page can be accessed by clicking on a box on the stable publix page or from clicking a box on the filter page. This page is very much alike the public stable page but it is for a box. Unlike the stable page this page also has a button for starting a conversation about this particular box with the stable owner.
   The page also has a map showing where the box is.
   At the very bottom services that are in the same area as the box will be listed.
6. Conversations
   1. This is a page that show you all the conversations you have. As a stable owner you will also get a button inside a particular conversation that says "I have rented out this box". Its just a shortcut from going to the dashboard and clicking that its rented out. The regular user will not see this button, just a regular conversation.
7. Dashboard
   1. Overview
      1. This is a simple overview of what you have listed at Stallplass.no. There is also 2 buttons here, one for creating your first stable and one for creating your first service.
      The visibility of these are controlled by if you have a stable or of you have services.
   2. Mine Staller
      1. This is the page where you can administer, edit and create your stables.
         1. You can create a new stable here.
         2. You can edit a stable you already have
         3. You can add boxes
         4. You can start advertising.
         5. You can set a box to rented out
            1. This can only be done on boxes that has advertising. Advertising controllers alot of stuff on boxes. Boxes without advertising are just showing up here in the dashboard, nowhere else.
         6. You can boost a box, set isSponsored=true. For advertising you have to advertise all the boxes in your stable but for boost/sponsored you can choose 1 box, 2 , 3 does not matter. Its idividual for each box.
   3. Leieforhold
      1. This can be removed.
   4. Tjenester
      1. This is the page where you can create a new service to get listed or manage the ones you have listed now. Servies also need the field advertisingActive=true to show up in search. A user that has a service that is advertisingActive=true can choose to set isActive=false if they want to hide the service.
      2. When creating a service the user has to choose 1 or more areas they cover. The to this with service_areas. They can choose to add Vestfold county, then also Telemark.
      They could also choose to add Vestfold county and Sandefjord municipality thats in Vestfold if they only cover Sandefjord.
      3. A service can have a set price or a price range.
8. Analyse
   1. This page will give the user insight about views etc.
9. Priser
   1.  This page shows the pricing calculators.
       1.  For boxes there is discount for the number of boxes you have.
           1.  5 boxes and above gives discount, 10 boxes and above gives discount
       2.  For boxes there is a discount if you choose 3 6 12 months
       3.  All discounts and base prices should be controlled by database and have fallbacks in the code if they are not set in the database.
       4.  The sponsored calculator shows pricing for x number of boxes for x number of days.
       Here we also need discounts for 30 days, 60 and 90. Should also be in the database.
       5. Services calcuatlor show the pricing for services by days. There should be discounts here for 30 days 60 and 90. Needs to be in the database.
10. Database
    1.  user model
        1.  The usermodel should not have firebaseId
        2.  The usermode should not have bio field.
        3.  the user do not need the rentals field anymore, a rental is not connected to a user. The stable owner just sets the box to isAvailabe or not.
    2.  Box model
        1.  The box model does not need the rentals field, same as for user.
    3.  conversations model
        1.  Do not call the field riderId, it should be userId
        2.  The conversation does not need rentals. 
        3.  A conversation is only connected to a box.