# Kisan Vyapar — Problem Statement

## The agricultural market-linkage problem

Indian farmers sell a large share of their produce at the nearest mandi or to the
local buyer, even when other markets or buyers would pay more. Several forces
combine to keep this true:

- **Poor price discovery.** A farmer rarely knows, at decision time, what a given
  commodity is worth in markets beyond the one they already travel to.
- **Fragmented buyers.** Vendors and farmers are not efficiently connected. A buyer
  looking for a quantity or grade of a crop must chase many farmers, and a farmer
  looking for demand must chase many buyers.
- **Hidden costs.** The headline mandi price is not the farmer's earnings. Transport,
  handling, commissions, and other costs differ by destination and can erase the
  benefit of a "higher" price.
- **No reliable negotiation/order trail.** Without structured offers and orders,
  commitments are informal, hard to track, and harder to trust.
- **Limited digital reach.** Marketplaces that are not mobile-first or that assume
  high digital literacy exclude the very users who need them most.

## The core insight this product is built around

> We do not tell farmers where the price is highest.
> We tell them where they can potentially earn the most.

Highest headline price ≠ highest farmer earnings. The organizing metric of Kisan
Vyapar is **estimated net realization** — expected selling value minus the real
costs of reaching that sale.

## What Kisan Vyapar sets out to do

1. Let farmers **list produce** (crop, quantity, quality, location, timing).
2. Let vendors **post buying requirements** (crop, quantity, quality, max price,
   timing, pickup location).
3. Improve **price discovery** by normalizing market/mandi information behind a
   clean service boundary.
4. **Match** farmer supply with vendor demand, weighted by factors such as crop,
   quality, quantity, price, distance, availability, and reliability.
5. Let both sides **negotiate** through structured offers and counter-offers.
6. Convert agreements into **orders** that flow through transport, delivery,
   payment, and trust/rating.

## Not in scope of Sprint 0

Sprint 0 builds the *foundation* (architecture, data layer, domain vocabulary,
service boundaries, documentation). Full farmer/vendor journeys, live mandi data,
payments, logistics tracking, and AI advisors are later sprints — this repository
does not pretend they exist today.
