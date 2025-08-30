/// <reference types="cypress" />

describe('Favorites', () => {
  beforeEach(function() {
    cy.login()
    // Ensure we're not on email verification page
    cy.location('pathname').then((pathname) => {
      if (pathname === '/verifiser-epost') {
        // Skip test if email verification is required
        cy.log('Email verification required, skipping test')
        this.skip()
      }
    })
  })

  it('kan legge til og fjerne favoritter på forskjellige annonse-typer', () => {
    // Intercept API-kall for å sikre de fungerer
    cy.intercept('POST', '/api/favorites', { statusCode: 200 }).as('addFavorite')
    cy.intercept('DELETE', '/api/favorites', { statusCode: 200 }).as('removeFavorite')
    cy.intercept('GET', '/api/favorites', { statusCode: 200, body: { favorites: [] } }).as('getFavorites')

    // Gå til søkesiden
    cy.visit('/sok')

    // Vent på at siden laster
    cy.contains('Stallplasser').should('be.visible')

    // Finn første boks-annonse og klikk på den
    cy.get('a[href*="/bokser/"]').first().click()

    // Vent på at detalj-siden laster
    cy.location('pathname').should('include', '/bokser/')

    // Sjekk at favoritt-knappen finnes og er outline (ikke favoritt)
    cy.get('[data-cy="favorite-button"]').should('be.visible')
    cy.get('[data-cy="favorite-button"]').find('svg').should('have.class', 'text-gray-400')

    // Klikk på favoritt-knappen - helt instant
    cy.get('[data-cy="favorite-button"]').click()

    // Sjekk at knappen umiddelbart blir rød
    cy.get('[data-cy="favorite-button"]').find('svg').should('have.class', 'text-red-500')

    // Vent på at API-kallet fullfører
    cy.wait('@addFavorite')

    // Gå til profil-siden for å bekrefte at favoritten ble lagret
    cy.visit('/profil')

    // Klikk på favoritter-fanen
    cy.contains('Favoritter').click()

    // Sjekk at favoritten vises i listen
    cy.contains('Boks').should('be.visible')

    // Klikk på "Se annonse" lenken
    cy.contains('Se annonse').click()

    // Sjekk at vi kommer tilbake til annonse-siden
    cy.location('pathname').should('include', '/bokser/')

    // Sjekk at favoritt-statusen beholdes
    cy.get('[data-cy="favorite-button"]').find('svg').should('have.class', 'text-red-500')

    // Klikk på favoritt-knappen igjen for å fjerne favoritten
    cy.get('[data-cy="favorite-button"]').click()

    // Sjekk at knappen umiddelbart blir outline igjen
    cy.get('[data-cy="favorite-button"]').find('svg').should('have.class', 'text-gray-400')

    // Vent på at API-kallet fullfører
    cy.wait('@removeFavorite')

    // Gå tilbake til profil-siden
    cy.visit('/profil')
    cy.contains('Favoritter').click()

    // Sjekk at favoritten er fjernet
    cy.contains('Ingen favoritter ennå').should('be.visible')
  })

  it('kan legge til favoritt på stall-annonse', () => {
    // Intercept API-kall
    cy.intercept('POST', '/api/favorites', { statusCode: 200 }).as('addFavorite')

    // Gå til søkesiden og bytt til staller
    cy.visit('/sok?mode=stables')

    // Vent på at siden laster
    cy.contains('Staller').should('be.visible')

    // Finn første stall-annonse og klikk på den
    cy.get('a[href*="/staller/"]').first().click()

    // Vent på at detalj-siden laster
    cy.location('pathname').should('include', '/staller/')

    // Sjekk at favoritt-knappen finnes og er outline
    cy.get('[data-cy="favorite-button"]').should('be.visible')
    cy.get('[data-cy="favorite-button"]').find('svg').should('have.class', 'text-gray-400')

    // Klikk på favoritt-knappen - helt instant
    cy.get('[data-cy="favorite-button"]').click()

    // Sjekk at knappen umiddelbart blir rød
    cy.get('[data-cy="favorite-button"]').find('svg').should('have.class', 'text-red-500')

    // Vent på at API-kallet fullfører
    cy.wait('@addFavorite')
  })

  it('beholder favoritt-status når man navigerer mellom sider', () => {
    // Intercept API-kall
    cy.intercept('POST', '/api/favorites', { statusCode: 200 }).as('addFavorite')
    cy.intercept('GET', '/api/favorites', { statusCode: 200, body: { favorites: [] } }).as('getFavorites')

    // Gå til søkesiden
    cy.visit('/sok')

    // Vent på at siden laster
    cy.contains('Stallplasser').should('be.visible')

    // Finn første boks-annonse og klikk på den
    cy.get('a[href*="/bokser/"]').first().click()

    // Vent på at detalj-siden laster
    cy.location('pathname').should('include', '/bokser/')

    // Sjekk at knappen er outline først
    cy.get('[data-cy="favorite-button"]').find('svg').should('have.class', 'text-gray-400')

    // Klikk på favoritt-knappen - helt instant
    cy.get('[data-cy="favorite-button"]').click()

    // Sjekk at knappen umiddelbart blir rød
    cy.get('[data-cy="favorite-button"]').find('svg').should('have.class', 'text-red-500')

    // Vent på at API-kallet fullfører
    cy.wait('@addFavorite')

    // Naviger tilbake til søkesiden
    cy.go('back')

    // Klikk på samme annonse igjen
    cy.get('a[href*="/bokser/"]').first().click()

    // Sjekk at favoritt-statusen beholdes (cache fungerer)
    cy.get('[data-cy="favorite-button"]').find('svg').should('have.class', 'text-red-500')
  })

  it('kan legge til favoritt på tjeneste-annonse', () => {
    // Intercept API-kall
    cy.intercept('POST', '/api/favorites', { statusCode: 200 }).as('addFavorite')

    // Gå til søkesiden og bytt til tjenester
    cy.visit('/sok?mode=services')

    // Vent på at siden laster
    cy.contains('Tjenester').should('be.visible')

    // Sjekk om det finnes tjenester, hvis ikke - opprett en test-tjeneste
    cy.get('body').then($body => {
      if ($body.text().includes('Ingen tjenester funnet')) {
        // Ingen tjenester finnes, vi må opprette en først
        cy.log('Ingen tjenester finnes, oppretter test-tjeneste')

        // Gå til dashboard for å opprette tjeneste
        cy.visit('/dashboard')

        // Klikk på "Legg til tjeneste" eller lignende
        cy.contains('Tjenester').click()

        // Dette kan variere basert på UI, så vi skipper hvis vi ikke finner knappen
        cy.get('body').then($body2 => {
          if ($body2.text().includes('Legg til tjeneste') || $body2.text().includes('Ny tjeneste')) {
            cy.contains('Legg til tjeneste').click()

            // Fyll ut skjema (dette må tilpasses faktisk UI)
            cy.get('input[name="title"]').type('Test Tjeneste')
            cy.get('textarea[name="description"]').type('Dette er en test tjeneste for favoritt-testing')
            cy.get('input[name="priceRangeMin"]').type('500')
            cy.get('input[name="priceRangeMax"]').type('1000')

            // Velg service type
            cy.get('select[name="serviceType"]').select('trainer')

            // Lagre
            cy.contains('Lagre').click()

            // Gå tilbake til søk
            cy.visit('/sok?mode=services')
          }
        })
      }
    })

    // Prøv å finne en tjeneste-annonse
    cy.get('a[href*="/tjenester/"]').first().then($link => {
      if ($link.length > 0) {
        // Klikk på første tjeneste-annonse
        cy.wrap($link).click()

        // Vent på at detalj-siden laster
        cy.location('pathname').should('include', '/tjenester/')

        // Sjekk at favoritt-knappen finnes og er outline
        cy.get('[data-cy="favorite-button"]').should('be.visible')
        cy.get('[data-cy="favorite-button"]').find('svg').should('have.class', 'text-gray-400')

        // Klikk på favoritt-knappen - helt instant
        cy.get('[data-cy="favorite-button"]').click()

        // Sjekk at knappen umiddelbart blir rød
        cy.get('[data-cy="favorite-button"]').find('svg').should('have.class', 'text-red-500')

        // Vent på at API-kallet fullfører
        cy.wait('@addFavorite')
      } else {
        cy.log('Ingen tjeneste-annonser funnet, skipper test')
      }
    })
  })

  it('viser tom tilstand når det ikke finnes favoritter', () => {
    // Gå til profil-siden
    cy.visit('/profil')

    // Klikk på favoritter-fanen
    cy.contains('Favoritter').click()

    // Sjekk at tom tilstand vises
    cy.contains('Ingen favoritter ennå').should('be.visible')
    cy.contains('Utforsk annonser').should('be.visible')
  })
})