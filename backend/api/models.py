from django.db import models


class Estate(models.Model):
	slug = models.SlugField(primary_key=True)
	name = models.CharField(max_length=100)
	area = models.CharField(max_length=100)
	description = models.TextField()
	image = models.URLField(max_length=500)

	class Meta:
		ordering = ['name']

	def __str__(self):
		return f'{self.name}, {self.area}'


class Property(models.Model):
	slug = models.SlugField(primary_key=True)
	estate = models.ForeignKey(Estate, on_delete=models.PROTECT, related_name='properties')
	title = models.CharField(max_length=180)
	location = models.CharField(max_length=100)
	city = models.CharField(max_length=100)
	rent = models.PositiveIntegerField()
	bedrooms = models.PositiveSmallIntegerField()
	amenity = models.CharField(max_length=240)
	kind = models.CharField(max_length=60)
	verified = models.BooleanField(default=False)
	vacant = models.BooleanField(default=True)
	image = models.URLField(max_length=500)
	image_alt = models.CharField(max_length=240)
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ['rent', 'title']

	def __str__(self):
		return self.title
