const estates = [
  {
    name: 'Kilimani',
    area: 'Nairobi',
    homes: '24 verified homes',
    description: 'A lively residential neighbourhood close to cafes, schools, and the city centre.',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=85',
  },
  {
    name: 'Runda',
    area: 'Nairobi',
    homes: '12 verified homes',
    description: 'Leafy, spacious streets with a quieter pace and easy access to the north of Nairobi.',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=85',
  },
  {
    name: 'Nyali',
    area: 'Mombasa',
    homes: '18 verified homes',
    description: 'Coastal living with everyday shops, schools, and the Indian Ocean close by.',
    image: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1000&q=85',
  },
  {
    name: 'Kileleshwa',
    area: 'Nairobi',
    homes: '16 verified homes',
    description: 'A calm, central neighbourhood with a growing mix of apartments and family homes.',
    image: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1000&q=85',
  },
  {
    name: 'Ruiru',
    area: 'Kiambu',
    homes: '21 verified homes',
    description: 'Connected suburban estates offering more room and a straightforward commute.',
    image: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1000&q=85',
  },
  {
    name: 'Karen',
    area: 'Nairobi',
    homes: '9 verified homes',
    description: 'Green, open residential living with local markets and outdoor spaces nearby.',
    image: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1000&q=85',
  },
]

function Estates() {
  return (
    <section className="container listing-page">
      <div className="listing-header">
        <div>
          <span className="eyebrow">Explore by neighbourhood</span>
          <h1 className="page-title">Find your kind of place.</h1>
          <p>Get to know the neighbourhoods behind the listings, then explore verified homes in each one.</p>
        </div>
      </div>
      <div className="estate-grid">
        {estates.map((estate) => (
          <article className="estate-card" key={estate.name}>
            <img src={estate.image} alt={`${estate.name} residential area`} loading="lazy" />
            <div className="estate-card-body">
              <h2>{estate.name}, {estate.area}</h2>
              <p>{estate.description}</p>
              <div className="estate-card-meta"><span>{estate.homes}</span><span>View area →</span></div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default Estates