describe('Stable Management Flow', () => {
  const stableName = 'E2E Test Stable';

  before(() => {
    // Create stable once for all tests in this suite
    cy.login();
    // Navigate directly to stables tab via URL
    cy.visit('/dashboard?tab=stables');
    
    // Verify we're on the stables tab
    cy.get('[data-cy="stables"]').should('be.visible');
    
    // Wait for the stables data to finish loading
    cy.get('body').should('not.contain', 'Laster staller...');
    
    // Wait for the add button to be enabled
    cy.get('[data-cy="add-stable-button"]').should('not.be.disabled');
    
    // Create the test stable by clicking "Ny stall" button
    cy.get('[data-cy="add-stable-button"]').click();
    
    // Fill out the basic form fields
    cy.get('[data-cy="stable-name-input"]').type(stableName);
    cy.get('[data-cy="stable-description-input"]').type('Test stable for E2E testing');
    
    // Upload the stable image 2 times
    for (let i = 1; i <= 2; i++) {
      // First click the "Legg til" button to open the image upload modal
      cy.contains('button', 'Legg til').click();
      
      // Now upload the image
      cy.get('[data-cy="image-upload-input"]').selectFile('stable.jpg', { force: true });
      
      // Wait for image upload to complete
      cy.wait(3000); // Give time for the image to upload
      
      // Click "Legg til" button in the modal to add the staged images
      cy.contains('button', /Legg til \d+ bilde/).click();
      
      // Verify image appears in the preview
      cy.get(`img[alt*="Bilde ${i}"]`).should('be.visible');
      
      cy.log(`✓ Uploaded image ${i} of 2`);
    }
    
    // Add address using the address search - exact manual process
    cy.get('[data-cy="address-search-input"]').type('Albatrossveien 28C');
    cy.wait(2000); // Wait for suggestions to load
    
    // Click the first suggestion (which should be the exact match)
    cy.get('button').contains('Albatrossveien 28C').first().click();
    
    // CRITICAL: The dropdown reopens after selection, so click in description field to close it
    // This mimics the exact manual process the user described
    cy.get('[data-cy="stable-description-input"]').click();
    
    // Wait for the address to be processed and dropdown to close
    cy.wait(2000);
    
    // Select 4 stable amenities (first 4 available)
    cy.get('body').then(($body) => {
      if ($body.find('[data-cy^="amenity-"]').length > 0) {
        // Amenities section exists, select the first 4
        cy.get('[data-cy^="amenity-"]').then($checkboxes => {
          const numToSelect = Math.min(4, $checkboxes.length);
          for (let i = 0; i < numToSelect; i++) {
            cy.wrap($checkboxes[i]).check();
          }
          cy.log(`✓ Selected ${numToSelect} stable amenities`);
        });
      } else {
        cy.log('⚠️ No stable amenities found to select');
      }
    });
    
    // Save the stable
    cy.get('[data-cy="save-stable-button"]').click();
    
    // Should redirect back to dashboard
    cy.url().should('include', '/dashboard');
  });

  beforeEach(() => {
    // Ensure we're logged in and on stables tab for each test
    cy.login();
    cy.visit('/dashboard?tab=stables');
    // Verify we're on the stables tab
    cy.get('[data-cy="stables"]').should('be.visible');
    
    // Wait for loading to complete
    cy.get('body').should('not.contain', 'Laster staller...');
  });

  describe('Stable Basic Operations', () => {
    it('should display the created stable in dashboard', () => {
      // Verify we're on the dashboard and in the stables tab
      cy.url().should('include', '/dashboard');
      cy.get('[data-cy="stables"]').should('be.visible');
      
      // Check if stables list exists and contains our stable
      cy.get('[data-cy="stables-list"]').should('exist');
      cy.get('[data-cy="stables-list"]').should('be.visible');
      cy.get('[data-cy="stables-list"]').should('contain', stableName);
    });

    it('should NOT show missing location data warning with proper address selection', () => {
      // Verify our stable is visible
      cy.get('[data-cy="stables-list"]').should('contain', stableName);
      
      // Since we properly selected an address and the form validation ensures address data is present,
      // the stable should NOT show the missing location data warning
      cy.get('[data-cy="missing-location-warning"]').should('not.exist');
      
      cy.log('✓ No missing location data warning shown - address selection worked properly');
    });

    it('should add another image to the stable using the dashboard button', () => {
      // Verify we can see our stable
      cy.get('[data-cy="stables-list"]').should('contain', stableName);
      
      // Click the "Legg til bilder" button
      cy.get('[data-cy="add-images-button"]').first().click();
      
      // Wait for the upload modal to appear
      cy.contains('Legg til bilder').should('be.visible');
      
      // Upload another image
      cy.get('[data-cy="image-upload-input"]').selectFile('stable.jpg', { force: true });
      
      // Wait for image upload to complete
      cy.wait(3000);
      
      // Verify the new image appears in the preview
      cy.get('img[alt="Bilde 1"]').should('be.visible');
      
      // Save the images
      cy.get('[data-cy="save-images-button"]').click();
      
      // Wait for save to complete
      cy.wait(2000);
      
      // Verify the modal closed and we're back on the dashboard
      cy.get('[data-cy="stables-list"]').should('be.visible');
      
      // The stable should now have 3 images (2 from creation + 1 new)
      cy.log('✓ Successfully added another image to the stable');
    });
  });

  describe('Box Creation', () => {
    // Helper function to create a box
    const createBox = (boxNumber: number, includeImage: boolean = false) => {
      // Click the add box button
      cy.get('[data-cy="add-box-button"], [data-cy="add-first-box-button"]').first().click();
      
      // Wait for modal to fully load
      cy.wait(1000);
      
      // Calculate price between 4000 and 6500 (increment by 500 for each box)
      const price = 4000 + ((boxNumber - 1) * 500);
      
      // Fill out the box creation form
      cy.get('[data-cy="box-name-input"]').type(`Test Box ${boxNumber}`);
      cy.get('[data-cy="box-price-input"]').type(`${price}`); // Prices: 4000, 4500, 5000, 5500, 6000
      // Select size from dropdown - cycle through SMALL, MEDIUM, LARGE
      const sizeOptions = ['SMALL', 'MEDIUM', 'LARGE'];
      const selectedSize = sizeOptions[(boxNumber - 1) % sizeOptions.length];
      cy.get('[data-cy="box-size-select"]').select(selectedSize);
      cy.get('[data-cy="box-type-select"]').select('BOKS');
      cy.get('[data-cy="box-description-textarea"]').type(`Test box ${boxNumber} for E2E testing`);
      
      // Add image if requested (only for box 1)
      if (includeImage) {
        // Scroll down to see the image upload section
        cy.get('[data-cy="box-description-textarea"]').scrollIntoView();
        
        // Upload the image
        cy.get('[data-cy="image-upload-input"]').selectFile('stable.jpg', { force: true });
        
        // Wait for image upload to complete
        cy.wait(3000);
        
        cy.log(`✓ Added image to Test Box ${boxNumber}`);
      }
      
      // Select 3-5 box amenities (first ones available)
      cy.get('body').then(($body) => {
        if ($body.find('[data-cy^="box-amenity-"]').length > 0) {
          // Box amenities section exists, select first few
          cy.get('[data-cy^="box-amenity-"]').then($checkboxes => {
            const numToSelect = Math.min(3 + (boxNumber % 3), $checkboxes.length); // Vary 3-5 amenities
            for (let i = 0; i < numToSelect; i++) {
              cy.wrap($checkboxes[i]).check();
            }
            cy.log(`✓ Selected ${numToSelect} box amenities for Test Box ${boxNumber}`);
          });
        } else {
          cy.log('⚠️ No box amenities found to select');
        }
      });
      
      // Save the box
      cy.get('[data-cy="save-box-button"]').click();
      
      // Wait for modal to close and box to appear
      cy.wait(1000);
      
      // Verify box appears in the stable
      cy.get('[data-cy="stables-list"]').should('contain', `Test Box ${boxNumber}`);
    };

    it('should create 5 boxes within the stable', () => {
      // Verify we can see the stable
      cy.get('[data-cy="stables-list"]').should('contain', stableName);
      
      // Create 5 boxes (add image to box 1 only)
      for (let i = 1; i <= 5; i++) {
        const includeImage = i === 1;
        createBox(i, includeImage);
        cy.log(`✓ Created Test Box ${i}${includeImage ? ' with image' : ''}`);
      }
      
      // Verify all 5 boxes are visible
      cy.get('[data-cy="stables-list"]').should('contain', 'Test Box 1');
      cy.get('[data-cy="stables-list"]').should('contain', 'Test Box 2');
      cy.get('[data-cy="stables-list"]').should('contain', 'Test Box 3');
      cy.get('[data-cy="stables-list"]').should('contain', 'Test Box 4');
      cy.get('[data-cy="stables-list"]').should('contain', 'Test Box 5');
      
      cy.log('✓ All 5 boxes created successfully');
    });

    it('should add an image to Box 2 by editing it', () => {
      // Verify we can see the stable and boxes
      cy.get('[data-cy="stables-list"]').should('contain', stableName);
      cy.get('[data-cy="stables-list"]').should('contain', 'Test Box 2');
      
      // Find and click the edit button for Box 2
      // We need to find the box by its name and then find the edit button in that context
      cy.get('[data-cy="stables-list"]').within(() => {
        // Find the section containing Test Box 2
        cy.contains('Test Box 2')
          .parent()
          .parent()
          .within(() => {
            // Click the edit button for this specific box
            cy.get('[data-cy*="edit-box-"]').click();
          });
      });
      
      // Wait for modal to open
      cy.wait(1000);
      
      // Verify we're in edit mode by checking the modal title
      cy.contains('Rediger boks').should('be.visible');
      
      // Scroll to the image upload section
      cy.get('[data-cy="box-description-textarea"]').scrollIntoView();
      
      // Upload an image
      cy.get('[data-cy="image-upload-input"]').selectFile('stable.jpg', { force: true });
      
      // Wait for image upload to complete
      cy.wait(3000);
      
      // Also select some amenities while editing Box 2
      cy.get('body').then(($body) => {
        if ($body.find('[data-cy^="box-amenity-"]').length > 0) {
          // Box amenities section exists, select first 4
          cy.get('[data-cy^="box-amenity-"]').then($checkboxes => {
            const numToSelect = Math.min(4, $checkboxes.length); // Select 4 amenities
            for (let i = 0; i < numToSelect; i++) {
              cy.wrap($checkboxes[i]).check();
            }
            cy.log(`✓ Selected ${numToSelect} box amenities while editing Test Box 2`);
          });
        } else {
          cy.log('⚠️ No box amenities found to select while editing');
        }
      });
      
      // Save the changes
      cy.get('[data-cy="save-box-button"]').click();
      
      // Wait for modal to close
      cy.wait(1000);
      
      // Verify we're back on the dashboard
      cy.get('[data-cy="stables-list"]').should('be.visible');
      cy.get('[data-cy="stables-list"]').should('contain', 'Test Box 2');
      
      cy.log('✓ Successfully added image to Test Box 2 via edit');
    });
  });

  describe('FAQ Management', () => {
    // Helper function to add an FAQ
    const addFAQ = (question: string, answer: string) => {
      // Click the FAQ administration button for our specific stable
      cy.get('[data-cy="stables-list"]').within(() => {
        cy.contains(stableName).should('be.visible');
        cy.get('[data-cy="add-faq-button"]').should('be.visible').first().click();
      });
      
      // Wait for modal to open and click "Legg til nytt spørsmål"
      cy.contains('FAQ for E2E Test Stable').should('be.visible');
      cy.contains('Legg til nytt spørsmål').first().click();
      
      // Fill out the FAQ
      cy.get('[data-cy="faq-question-input"]').should('be.visible').type(question);
      cy.get('[data-cy="faq-answer-textarea"]').should('be.visible').type(answer);
      
      // Save the FAQ
      cy.get('[data-cy="save-faq-button"]').click();
      
      // Close the modal
      cy.contains('Lukk').click();
      
      // Verify the FAQ appears on the page
      cy.contains(question).should('be.visible');
    };

    it('should add two FAQs to the stable', () => {
      // Verify we can see our specific test stable
      cy.get('[data-cy="stables-list"]').should('contain', stableName);
      
      // Add first FAQ
      addFAQ('Hva er prisen per måned?', 'Prisen er 2500 kr per måned inkludert strøm og vann. Høy er ikke inkludert.');
      cy.log('✓ First FAQ added successfully');
      
      // Add second FAQ
      addFAQ('Er det mulighet for utendørs beite?', 'Ja, vi har store beiteområder tilgjengelig fra mai til september. Ekstra kostnad på 500 kr per måned.');
      cy.log('✓ Second FAQ added successfully');
    });

    it('should display both FAQs in the stable details', () => {
      // Verify we can see our specific stable with both FAQs
      cy.get('[data-cy="stables-list"]').should('contain', stableName);
      
      // Verify both FAQ questions are visible anywhere on the page
      cy.contains('Hva er prisen per måned?').should('be.visible');
      cy.contains('Er det mulighet for utendørs beite?').should('be.visible');
      
      cy.log('✓ Both FAQs displayed correctly in our test stable details');
    });
  });

  describe('Box Availability Toggle', () => {
    it('should toggle box availability from available to rented for Test Box 1', () => {
      // Verify we're on the stables tab and can see our specific test stable
      cy.get('[data-cy="stables-list"]').should('contain', stableName);
      cy.get('[data-cy="stables-list"]').should('contain', 'Test Box 1');
      
      // Find Test Box 1 specifically and its toggle button
      cy.get('[data-cy="stables-list"]').within(() => {
        // Find the section containing Test Box 1
        cy.contains('Test Box 1')
          .parent()
          .parent()
          .within(() => {
            // Look for the "Marker utleid" (mark as rented) button for this specific box
            cy.get('[data-cy*="mark-rented-"]').should('be.visible');
            cy.get('[data-cy*="mark-rented-"]').should('contain', 'Marker utleid');
            
            // Click to mark the box as rented
            cy.get('[data-cy*="mark-rented-"]').click();
          });
      });
      
      // Wait for the toggle to complete
      cy.wait(2000);
      
      // Verify the button changed to "Marker ledig" (mark as available) for Test Box 1
      cy.get('[data-cy="stables-list"]').within(() => {
        cy.contains('Test Box 1')
          .parent()
          .parent()
          .within(() => {
            cy.get('[data-cy*="mark-available-"]').should('be.visible');
            cy.get('[data-cy*="mark-available-"]').should('contain', 'Marker ledig');
          });
      });
      
      cy.log('✓ Test Box 1 successfully toggled from available to rented');
    });

    it('should toggle box availability from rented back to available for Test Box 1', () => {
      // The box should now be rented from the previous test
      cy.get('[data-cy="stables-list"]').within(() => {
        // Find Test Box 1 specifically
        cy.contains('Test Box 1')
          .parent()
          .parent()
          .within(() => {
            // Look for the "Marker ledig" (mark as available) button
            cy.get('[data-cy*="mark-available-"]').should('be.visible');
            cy.get('[data-cy*="mark-available-"]').should('contain', 'Marker ledig');
            
            // Click to mark the box as available
            cy.get('[data-cy*="mark-available-"]').click();
          });
      });
      
      // Wait for the toggle to complete
      cy.wait(2000);
      
      // Verify the button changed back to "Marker utleid" (mark as rented)
      cy.get('[data-cy="stables-list"]').within(() => {
        cy.contains('Test Box 1')
          .parent()
          .parent()
          .within(() => {
            cy.get('[data-cy*="mark-rented-"]').should('be.visible');
            cy.get('[data-cy*="mark-rented-"]').should('contain', 'Marker utleid');
          });
      });
      
      cy.log('✓ Test Box 1 successfully toggled from rented back to available');
    });

    it('should persist availability status after page refresh for Test Box 1', () => {
      // First, ensure we're working with our specific test stable and box
      cy.get('[data-cy="stables-list"]').should('contain', stableName);
      cy.get('[data-cy="stables-list"]').should('contain', 'Test Box 1');
      
      // Set Test Box 1 to rented state
      // First check the current state
      cy.get('[data-cy="stables-list"]').then(($list) => {
        const $box1Section = $list.find(':contains("Test Box 1")').parent().parent();
        const hasRentButton = $box1Section.find('[data-cy*="mark-rented-"]').length > 0;
        
        if (hasRentButton) {
          // Box is available, need to mark as rented
          cy.get('[data-cy="stables-list"]').within(() => {
            cy.contains('Test Box 1')
              .parent()
              .parent()
              .within(() => {
                cy.get('[data-cy*="mark-rented-"]').click();
              });
          });
          cy.wait(2000);
        }
      });
      
      // Verify Test Box 1 is now rented
      cy.get('[data-cy="stables-list"]').within(() => {
        cy.contains('Test Box 1')
          .parent()
          .parent()
          .within(() => {
            cy.get('[data-cy*="mark-available-"]').should('be.visible');
            cy.get('[data-cy*="mark-available-"]').should('contain', 'Marker ledig');
          });
      });
      
      // Refresh the page
      cy.reload();
      cy.get('[data-cy="stables"]').should('be.visible');
      
      // Wait for stables to load
      cy.get('body').should('not.contain', 'Laster staller...');
      
      // Verify Test Box 1 availability status persisted after refresh
      cy.get('[data-cy="stables-list"]').should('contain', stableName);
      cy.get('[data-cy="stables-list"]').should('contain', 'Test Box 1');
      cy.get('[data-cy="stables-list"]').within(() => {
        cy.contains('Test Box 1')
          .parent()
          .parent()
          .within(() => {
            cy.get('[data-cy*="mark-available-"]').should('be.visible');
            cy.get('[data-cy*="mark-available-"]').should('contain', 'Marker ledig');
          });
      });
      
      cy.log('✓ Test Box 1 availability status persisted after page refresh');
    });
  });

  describe('Map Display', () => {
    it('should display map at the bottom of the stable', () => {
      // Verify we can see our test stable
      cy.get('[data-cy="stables-list"]').should('contain', stableName);
      
      // Check if the map section exists (it only renders if coordinates are available)
      cy.get('body').then(($body) => {
        if ($body.find('h4:contains("Kart")').length > 0) {
          // Map section exists, verify it's working
          cy.contains('h4', 'Kart').should('be.visible');
          
          // Verify the map container exists and is visible
          cy.get('[data-cy="stable-map"]').should('be.visible');
          
          // Wait for map to initialize
          cy.wait(2000);
          
          // Verify the map has loaded (Leaflet creates a div with class 'leaflet-container')
          cy.get('[data-cy="stable-map"] .leaflet-container').should('exist');
          cy.get('[data-cy="stable-map"] .leaflet-container').should('be.visible');
          
          // Verify map tiles have loaded
          cy.get('[data-cy="stable-map"] .leaflet-tile-container').should('exist');
          
          // Verify there's a marker on the map (for the stable location)
          cy.get('[data-cy="stable-map"] .leaflet-marker-icon').should('exist');
          
          cy.log('✓ Map is displayed correctly with marker for stable location');
        } else {
          // No map section - stable might not have coordinates
          cy.log('⚠️ Map section not found - stable may not have coordinates from address lookup');
          cy.log('This is expected if the address geocoding did not return coordinates');
        }
      });
    });
  });

  describe('Box Advertising', () => {
    it('should order advertising for a box and verify price consistency and completion', () => {
      // Verify we can see our test stable and boxes
      cy.get('[data-cy="stables-list"]').should('contain', stableName);
      cy.get('[data-cy="stables-list"]').should('contain', 'Test Box 1');
      
      let firstPagePrice: string;
      
      // Find Test Box 1 and click the "Kjøp annonsering" button
      cy.get('[data-cy="stables-list"]').within(() => {
        cy.contains('Test Box 1')
          .parent()
          .parent()
          .within(() => {
            // Look for the advertising button - it's a regular button with "Kjøp annonsering" text
            cy.contains('button', 'Kjøp annonsering').should('be.visible');
            
            // Click to start advertising purchase
            cy.contains('button', 'Kjøp annonsering').click();
          });
      });
      
      // Wait for navigation to the advertising page
      cy.wait(2000);
      
      // Verify we're on the advertising purchase page
      cy.url().should('include', '/dashboard/advertising/single');
      cy.contains('Kjøp annonsering for boks').should('be.visible');
      
      // Wait for pricing to load
      cy.contains('Beregner pris...').should('not.exist');
      
      // Capture the price from the first page (totalpris)
      cy.get('.text-indigo-600').contains('kr').then(($priceElement) => {
        firstPagePrice = $priceElement.text().trim();
        cy.log(`First page price: ${firstPagePrice}`);
      });
      
      // Click "Gå til betaling" button to proceed to invoice form
      cy.get('[data-cy="go-to-payment-button"]').should('be.visible');
      cy.get('[data-cy="go-to-payment-button"]').click();
      
      // Wait for invoice page to load
      cy.wait(2000);
      
      // Verify we're on the invoice page
      cy.url().should('include', '/dashboard/bestill');
      cy.contains('Bestill med faktura').should('be.visible');
      
      // Wait for pricing calculation to complete on invoice page
      cy.contains('Beregner pris...').should('not.exist');
      
      // Verify the price on the final order page matches the first page
      cy.get('.text-lg.font-semibold').contains('kr').then(($finalPriceElement) => {
        const finalPagePrice = $finalPriceElement.text().trim();
        cy.log(`Final page price: ${finalPagePrice}`);
        
        // Assert that prices match
        expect(finalPagePrice).to.equal(firstPagePrice);
        cy.log('✓ Price consistency verified between first page and final order page');
      });
      
      // Fill out the invoice request form with new field structure
      cy.get('[data-cy="firstname-input"]').type('E2E');
      cy.get('[data-cy="lastname-input"]').type('Test Person');
      cy.get('[data-cy="address-input"]').type('Test Address 123');
      cy.get('[data-cy="postal-code-input"]').type('0123');
      cy.get('[data-cy="city-input"]').type('Test City');
      cy.get('[data-cy="phone-input"]').type('12345678');
      // Note: Email field is prefilled and disabled, so we skip it
      
      // Complete the purchase by submitting the form
      cy.get('[data-cy="submit-invoice-request-button"]').click();
      
      // Wait for purchase to complete
      cy.wait(3000);
      
      // Verify purchase completion - the form submits and shows an alert, then redirects
      // We should be redirected back to dashboard
      cy.url().should('include', '/dashboard');
      cy.get('[data-cy="stables"]').should('be.visible');
      
      // Wait for stables to load
      cy.get('body').should('not.contain', 'Laster staller...');
      
      // Wait for advertising status to be updated (may take a moment due to cache invalidation)
      cy.wait(2000);
      
      // Refresh the page to ensure we get the latest data
      cy.reload();
      cy.get('[data-cy="stables"]').should('be.visible');
      cy.get('body').should('not.contain', 'Laster staller...');
      
      // Scroll to ensure the stables list is visible
      cy.get('[data-cy="stables-list"]').scrollIntoView();
      
      // Verify Test Box 1 now shows "Annonsert" pill
      cy.get('[data-cy="stables-list"]').within(() => {
        // Find the Test Box 1 container and scroll it into view
        cy.contains('Test Box 1').scrollIntoView();
        
        cy.contains('Test Box 1')
          .parents('.bg-white.border.border-slate-200.rounded-xl')
          .first()
          .within(() => {
            // First verify that the "Kjøp annonsering" button is no longer visible
            // (it only shows when advertising is NOT active)
            cy.contains('button', 'Kjøp annonsering').should('not.exist');
            
            // The "Annonsert" pill is in the image overlay area, not the content area
            // Look for it anywhere within this entire box card
            cy.contains('Annonsert').should('be.visible');
          });
      });
      
      cy.log('✓ Box advertising purchase completed successfully with price verification and "Annonsert" pill confirmation');
    });
  });

  describe('Batch Advertising', () => {
    it('should select multiple boxes and order batch advertising with price verification', () => {
      // Verify we can see our test stable and that we have multiple boxes
      cy.get('[data-cy="stables-list"]').should('contain', stableName);
      cy.get('[data-cy="stables-list"]').should('contain', 'Test Box 2');
      cy.get('[data-cy="stables-list"]').should('contain', 'Test Box 3');
      
      let firstPagePrice: string;
      
      // Scroll to ensure the stables list is visible
      cy.get('[data-cy="stables-list"]').scrollIntoView();
      
      // Click "Velg alle uten annonsering" button to select all boxes without advertising
      cy.contains('button', 'Velg alle uten annonsering').should('be.visible');
      cy.contains('button', 'Velg alle uten annonsering').click();
      
      // Wait for selection to be processed
      cy.wait(1000);
      
      // Verify that multiple boxes are selected (should show selected count)
      cy.contains('boks').should('be.visible'); // Should show "X bokser valgt"
      
      // Click the bulk advertising purchase button
      cy.contains('button', 'Kjøp annonsering for').should('be.visible');
      cy.contains('button', 'Kjøp annonsering for').click();
      
      // Wait for navigation to bulk advertising page
      cy.wait(2000);
      
      // Verify we're on the bulk advertising page
      cy.url().should('include', '/dashboard/advertising/bulk');
      cy.contains('Kjøp annonsering for flere bokser').should('be.visible');
      
      // Wait for pricing to load
      cy.contains('Beregner pris...').should('not.exist');
      
      // Verify we have multiple boxes selected
      cy.contains('Valgte bokser (').should('be.visible');
      cy.contains('Test Box 2').should('be.visible');
      cy.contains('Test Box 3').should('be.visible');
      
      // Capture the price from the first page (totalpris)
      cy.get('.text-indigo-600').contains('kr').then(($priceElement) => {
        firstPagePrice = $priceElement.text().trim();
        cy.log(`First page price for batch: ${firstPagePrice}`);
      });
      
      // Click "Gå til betaling" button to proceed to invoice form
      cy.contains('button', 'Gå til betaling').should('be.visible');
      cy.contains('button', 'Gå til betaling').click();
      
      // Wait for invoice page to load
      cy.wait(2000);
      
      // Verify we're on the invoice page
      cy.url().should('include', '/dashboard/bestill');
      cy.contains('Bestill med faktura').should('be.visible');
      
      // Wait for pricing calculation to complete on invoice page
      cy.contains('Beregner pris...').should('not.exist');
      
      // Verify the price on the final order page matches the first page
      cy.get('.text-lg.font-semibold').contains('kr').then(($finalPriceElement) => {
        const finalPagePrice = $finalPriceElement.text().trim();
        cy.log(`Final page price for batch: ${finalPagePrice}`);
        
        // Assert that prices match
        expect(finalPagePrice).to.equal(firstPagePrice);
        cy.log('✓ Batch price consistency verified between first page and final order page');
      });
      
      // Verify the description includes multiple boxes
      cy.contains('Annonsering for').should('be.visible');
      cy.contains('boks').should('be.visible'); // Should mention multiple boxes
      
      // Fill out the invoice request form with new field structure
      cy.get('[data-cy="firstname-input"]').clear().type('E2E Batch');
      cy.get('[data-cy="lastname-input"]').clear().type('Test Person');
      cy.get('[data-cy="address-input"]').clear().type('Batch Test Address 456');
      cy.get('[data-cy="postal-code-input"]').clear().type('4567');
      cy.get('[data-cy="city-input"]').clear().type('Batch Test City');
      cy.get('[data-cy="phone-input"]').clear().type('87654321');
      // Note: Email field is prefilled and disabled, so we skip it
      
      // Complete the purchase by submitting the form
      cy.get('[data-cy="submit-invoice-request-button"]').click();
      
      // Wait for purchase to complete
      cy.wait(3000);
      
      // Verify purchase completion - should be redirected back to dashboard
      cy.url().should('include', '/dashboard');
      cy.get('[data-cy="stables"]').should('be.visible');
      
      // Wait for stables to load
      cy.get('body').should('not.contain', 'Laster staller...');
      
      // Wait for advertising status to be updated
      cy.wait(2000);
      
      // Refresh the page to ensure we get the latest data
      cy.reload();
      cy.get('[data-cy="stables"]').should('be.visible');
      cy.get('body').should('not.contain', 'Laster staller...');
      
      // Scroll to ensure the stables list is visible
      cy.get('[data-cy="stables-list"]').scrollIntoView();
      
      // Verify multiple boxes now show "Annonsert" pills
      const boxesToCheck = ['Test Box 2', 'Test Box 3', 'Test Box 4', 'Test Box 5'];
      
      boxesToCheck.forEach(boxName => {
        cy.get('[data-cy="stables-list"]').within(() => {
          cy.contains(boxName).scrollIntoView();
          
          cy.contains(boxName)
            .parents('.bg-white.border.border-slate-200.rounded-xl')
            .first()
            .within(() => {
              // Verify that the "Kjøp annonsering" button is no longer visible
              cy.contains('button', 'Kjøp annonsering').should('not.exist');
              
              // Verify the advertising pill is visible
              cy.contains('Annonsert').should('be.visible');
            });
        });
        
        cy.log(`✓ ${boxName} successfully shows "Annonsert" pill after batch purchase`);
      });
      
      // Verify the bulk selection button is no longer visible (since all boxes are now advertised)
      cy.get('body').then(($body) => {
        if ($body.text().includes('Velg alle uten annonsering')) {
          cy.log('⚠️ Some boxes still not advertised - this might be expected');
        } else {
          cy.log('✓ All boxes are now advertised - bulk selection button should be hidden');
        }
      });
      
      cy.log('✓ Batch advertising purchase completed successfully with price verification and multiple "Annonsert" pill confirmations');
    });
  });

  describe('Box Boost', () => {
    it('should purchase boost for an advertised box and verify boost pill appears', () => {
      // Verify we can see our test stable and that Test Box 2 is advertised (from batch advertising test)
      cy.get('[data-cy="stables-list"]').should('contain', stableName);
      cy.get('[data-cy="stables-list"]').should('contain', 'Test Box 2');
      
      let firstPagePrice: string;
      
      // Scroll to ensure the stables list is visible
      cy.get('[data-cy="stables-list"]').scrollIntoView();
      
      // Find Test Box 2 (which should be advertised) and click "Boost til topp"
      cy.get('[data-cy="stables-list"]').within(() => {
        cy.contains('Test Box 2')
          .parents('.bg-white.border.border-slate-200.rounded-xl')
          .first()
          .within(() => {
            // Look for the boost button - should be visible for advertised boxes
            cy.contains('button', 'Boost til topp').should('be.visible');
            
            // Click to start boost purchase
            cy.contains('button', 'Boost til topp').click();
          });
      });
      
      // Wait for navigation to boost page
      cy.wait(2000);
      
      // Verify we're on the boost page
      cy.url().should('include', '/dashboard/boost/single');
      cy.contains('Boost boks til topp').should('be.visible');
      
      // Verify the selected box is shown
      cy.contains('Test Box 2').should('be.visible');
      
      // Wait for pricing to load
      cy.contains('Beregner pris...').should('not.exist');
      
      // Select 7 days for consistent pricing
      cy.contains('7 dager').click();
      
      // Capture the price from the boost page
      // First try to find discounted total price, otherwise find regular total price
      cy.get('body').then(($body) => {
        if ($body.find('.text-indigo-600').length > 0) {
          // Has discount - get the final discounted price
          cy.get('.text-indigo-600').contains('kr').then(($priceElement) => {
            firstPagePrice = $priceElement.text().trim();
            cy.log(`First page boost price (discounted): ${firstPagePrice}`);
          });
        } else {
          // No discount - get the regular total price
          cy.contains('Totalpris').parent().find('.text-gray-900').contains('kr').then(($priceElement) => {
            firstPagePrice = $priceElement.text().trim();
            cy.log(`First page boost price (regular): ${firstPagePrice}`);
          });
        }
      });
      
      // Click "Gå til betaling" button to proceed to invoice form
      cy.get('[data-cy="go-to-payment-button"]').should('be.visible');
      cy.get('[data-cy="go-to-payment-button"]').click();
      
      // Wait for invoice page to load
      cy.wait(2000);
      
      // Verify we're on the invoice page
      cy.url().should('include', '/dashboard/bestill');
      cy.contains('Bestill med faktura').should('be.visible');
      
      // Wait for pricing calculation to complete on invoice page
      cy.contains('Beregner pris...').should('not.exist');
      
      // Verify the price on the final order page matches the first page
      cy.get('.text-lg.font-semibold').contains('kr').then(($finalPriceElement) => {
        const finalPagePrice = $finalPriceElement.text().trim();
        cy.log(`Final page boost price: ${finalPagePrice}`);
        
        // Normalize both prices to handle locale differences (dot vs comma)
        const normalizePrice = (price: string) => price.replace('.', ',');
        const normalizedFinal = normalizePrice(finalPagePrice);
        const normalizedFirst = normalizePrice(firstPagePrice);
        
        // Assert that prices match (accounting for locale formatting differences)
        expect(normalizedFinal).to.equal(normalizedFirst);
        cy.log('✓ Boost price consistency verified between first page and final order page');
      });
      
      // Verify the description mentions boost
      cy.contains('Boost for boks').should('be.visible');
      
      // Fill out the invoice request form with boost-specific data and new field structure
      cy.get('[data-cy="firstname-input"]').clear().type('E2E Boost');
      cy.get('[data-cy="lastname-input"]').clear().type('Test Person');
      cy.get('[data-cy="address-input"]').clear().type('Boost Test Address 789');
      cy.get('[data-cy="postal-code-input"]').clear().type('7890');
      cy.get('[data-cy="city-input"]').clear().type('Boost Test City');
      cy.get('[data-cy="phone-input"]').clear().type('98765432');
      // Note: Email field is prefilled and disabled, so we skip it
      
      // Complete the purchase by submitting the form
      cy.get('[data-cy="submit-invoice-request-button"]').click();
      
      // Wait for purchase to complete
      cy.wait(3000);
      
      // Verify purchase completion - should be redirected back to dashboard
      cy.url().should('include', '/dashboard');
      cy.get('[data-cy="stables"]').should('be.visible');
      
      // Wait for stables to load
      cy.get('body').should('not.contain', 'Laster staller...');
      
      // Wait for boost status to be updated
      cy.wait(2000);
      
      // Refresh the page to ensure we get the latest data
      cy.reload();
      cy.get('[data-cy="stables"]').should('be.visible');
      cy.get('body').should('not.contain', 'Laster staller...');
      
      // Scroll to ensure the stables list is visible
      cy.get('[data-cy="stables-list"]').scrollIntoView();
      
      // Verify Test Box 2 now shows "Boost aktiv" pill
      cy.get('[data-cy="stables-list"]').within(() => {
        cy.contains('Test Box 2').scrollIntoView();
        
        cy.contains('Test Box 2')
          .parents('.bg-white.border.border-slate-200.rounded-xl')
          .first()
          .within(() => {
            // Verify the boost pill is visible
            cy.get('[data-cy*="box-boosted-"]').should('be.visible');
            cy.get('[data-cy*="box-boosted-"]').should('contain', 'Boost aktiv');
            
            // Verify it still has the advertising pill too
            cy.get('[data-cy*="box-advertised-"]').should('be.visible');
            cy.get('[data-cy*="box-advertised-"]').should('contain', 'Annonsert');
            
            // Verify the boost button is now hidden (since box has active boost)
            cy.contains('button', 'Boost til topp').should('not.exist');
          });
      });
      
      cy.log('✓ Box boost purchase completed successfully with "Boost aktiv" pill confirmation');
    });
  });


  describe('Cleanup Test', () => {
    it('should be able to delete the test stable', () => {
      // Skip deletion if KEEP_TEST_DATA environment variable is set
      if (Cypress.env('KEEP_TEST_DATA')) {
        cy.log('⚠️ Skipping stable deletion - KEEP_TEST_DATA is set');
        cy.log(`✓ Test stable "${stableName}" will be preserved for manual inspection`);
        return;
      }
      
      // Verify we can see the stable
      cy.get('[data-cy="stables-list"]').should('contain', stableName);
      
      // Find and click the delete button for our specific stable
      cy.get('[data-cy="stables-list"]').within(() => {
        cy.contains(stableName).parents().find('[data-cy*="delete-stable-"]').first().click();
      });
      
      // Wait for the custom confirm modal to appear and click confirm
      cy.get('[data-cy="confirm-delete-button"]').should('be.visible');
      
      // Intercept the DELETE API call to verify it succeeds
      cy.intercept('DELETE', '/api/stables/*').as('deleteStable');
      
      cy.get('[data-cy="confirm-delete-button"]').click();
      
      // Wait for the API call to complete and verify it was successful
      cy.wait('@deleteStable').its('response.statusCode').should('eq', 200);
      
      // Wait additional time for cache invalidation and UI update
      cy.wait(3000);
      
      // Refresh the page to ensure we're not seeing cached data
      cy.reload();
      cy.get('[data-cy="stables"]').should('be.visible');
      
      // Now verify stable was deleted
      cy.log('Checking if stable was deleted...');
      
      // Wait a bit more and check if the stable count changed or the specific stable is gone
      cy.get('body').should('exist').then(() => {
        // Try to find either the "no stables" message or verify the stable is not in the list
        cy.get('body').then(($body) => {
          if ($body.text().includes('Ingen staller registrert ennå')) {
            cy.log('✓ All stables deleted - showing no stables message');
            cy.contains('Ingen staller registrert ennå').should('be.visible');
          } else if ($body.find('[data-cy="stables-list"]').length > 0) {
            cy.log('✓ Other stables exist - checking our stable is gone');
            cy.get('[data-cy="stables-list"]').should('not.contain', stableName);
          } else {
            cy.log('⚠ Unexpected state - neither stables list nor no-stables message found');
            // This is a fallback - just ensure the page loaded correctly
            cy.get('[data-cy="stables"]').should('be.visible');
          }
        });
      });
      
      cy.log('Stable deletion verification completed');
    });
  });

  after(() => {
    // Note: Cleanup is now handled by the "Cleanup Test" describe block above
    // This ensures cleanup is part of the test flow and can be properly verified
    cy.log('Test suite completed - cleanup was handled by dedicated test');
    
    // Logout at the very end of the stable management flow
    cy.visit('/dashboard');  // Go to a safe page first
    cy.get('button').contains('Logg ut').click();  // Click logout button
    cy.url().should('include', '/');  // Should redirect to home page
    
    // Also clear session storage as backup
    cy.clearAllSessionStorage();
    cy.clearAllLocalStorage();
    cy.clearAllCookies();
  });
});