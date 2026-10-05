from django.core.management.base import BaseCommand

from api.models import Estate, Property


ESTATES = [
    {
        'slug': 'kilimani',
        'name': 'Kilimani',
        'area': 'Nairobi',
        'description': 'A lively residential neighbourhood close to cafes, schools, and the city centre.',
        'image': 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=85',
    },
    {
        'slug': 'westlands',
        'name': 'Westlands',
        'area': 'Nairobi',
        'description': 'A connected urban area with shops, restaurants, offices, and established residential streets.',
        'image': 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1000&q=85',
    },
    {
        'slug': 'kileleshwa',
        'name': 'Kileleshwa',
        'area': 'Nairobi',
        'description': 'A calm, central neighbourhood with a growing mix of apartments and family homes.',
        'image': 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1000&q=85',
    },
    {
        'slug': 'ruiru',
        'name': 'Ruiru',
        'area': 'Kiambu',
        'description': 'Connected suburban estates offering more room and a straightforward commute.',
        'image': 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1000&q=85',
    },
    {
        'slug': 'karen',
        'name': 'Karen',
        'area': 'Nairobi',
        'description': 'Green, open residential living with local markets and outdoor spaces nearby.',
        'image': 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1000&q=85',
    },
    {
        'slug': 'nyali',
        'name': 'Nyali',
        'area': 'Mombasa',
        'description': 'Coastal living with everyday shops, schools, and the Indian Ocean close by.',
        'image': 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1000&q=85',
    },
    {
        'slug': 'runda',
        'name': 'Runda',
        'area': 'Nairobi',
        'description': 'Leafy, spacious streets with a quieter pace and easy access to northern Nairobi.',
        'image': 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=85',
    },
]

PROPERTIES = [
    {
        'slug': 'kilimani-garden-apartment',
        'estate': 'kilimani',
        'title': 'Garden-view apartment',
        'location': 'Kilimani',
        'city': 'Nairobi',
        'rent': 68000,
        'bedrooms': 2,
        'amenity': 'Lift, 24/7 security',
        'kind': 'Apartment',
        'verified': True,
        'image': 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=85',
        'image_alt': 'Bright modern apartment opening onto a garden terrace',
    },
    {
        'slug': 'westlands-city-apartment',
        'estate': 'westlands',
        'title': 'Sunlit city apartment',
        'location': 'Westlands',
        'city': 'Nairobi',
        'rent': 95000,
        'bedrooms': 2,
        'amenity': 'Pool, backup power',
        'kind': 'Apartment',
        'verified': True,
        'image': 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1000&q=85',
        'image_alt': 'Contemporary neutral living room with wide windows',
    },
    {
        'slug': 'kileleshwa-family-home',
        'estate': 'kileleshwa',
        'title': 'Quiet family residence',
        'location': 'Kileleshwa',
        'city': 'Nairobi',
        'rent': 118000,
        'bedrooms': 3,
        'amenity': 'Garden, parking',
        'kind': 'Townhouse',
        'verified': True,
        'image': 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1000&q=85',
        'image_alt': 'Modern family home with a leafy outdoor area',
    },
    {
        'slug': 'ruiru-courtyard-home',
        'estate': 'ruiru',
        'title': 'Courtyard maisonette',
        'location': 'Ruiru',
        'city': 'Kiambu',
        'rent': 52000,
        'bedrooms': 3,
        'amenity': 'Gated estate, parking',
        'kind': 'Maisonette',
        'verified': True,
        'image': 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=85',
        'image_alt': 'Modern two-storey house with landscaped front garden',
    },
    {
        'slug': 'karen-green-home',
        'estate': 'karen',
        'title': 'Green garden bungalow',
        'location': 'Karen',
        'city': 'Nairobi',
        'rent': 145000,
        'bedrooms': 3,
        'amenity': 'Garden, pet friendly',
        'kind': 'Bungalow',
        'verified': True,
        'image': 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1000&q=85',
        'image_alt': 'Spacious home set among mature trees',
    },
    {
        'slug': 'nyali-coastal-flat',
        'estate': 'nyali',
        'title': 'Coastal breeze flat',
        'location': 'Nyali',
        'city': 'Mombasa',
        'rent': 48000,
        'bedrooms': 1,
        'amenity': 'Balcony, water included',
        'kind': 'Apartment',
        'verified': True,
        'image': 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1000&q=85',
        'image_alt': 'Airy coastal apartment interior in warm natural light',
    },
]


class Command(BaseCommand):
    help = 'Create or update the sample estates and property listings.'

    def handle(self, *args, **options):
        for estate_data in ESTATES:
            Estate.objects.update_or_create(slug=estate_data['slug'], defaults=estate_data)

        for property_data in PROPERTIES:
            values = property_data.copy()
            estate = Estate.objects.get(slug=values.pop('estate'))
            Property.objects.update_or_create(
                slug=values['slug'],
                defaults={**values, 'estate': estate},
            )

        self.stdout.write(self.style.SUCCESS(
            f'Seeded {len(PROPERTIES)} properties across {len(ESTATES)} estates.'
        ))