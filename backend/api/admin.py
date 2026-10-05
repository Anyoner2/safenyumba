from django.contrib import admin

from .models import Estate, Property


@admin.register(Estate)
class EstateAdmin(admin.ModelAdmin):
	list_display = ['name', 'area']
	search_fields = ['name', 'area']
	prepopulated_fields = {'slug': ['name']}


@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
	list_display = ['title', 'location', 'city', 'rent', 'bedrooms', 'verified', 'vacant']
	list_filter = ['verified', 'vacant', 'kind', 'city']
	search_fields = ['title', 'location', 'city', 'estate__name']
