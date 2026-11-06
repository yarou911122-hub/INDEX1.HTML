from django.contrib import admin
from .models import Publication, Project

@admin.register(Publication)
class PublicationAdmin(admin.ModelAdmin):
    list_display = ("title", "authors", "year", "publication_type")
    list_filter = ("year", "publication_type")
    search_fields = ("title", "authors")

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("title", "principal_investigator", "start_year", "end_year")
    list_filter = ("start_year",)
    search_fields = ("title", "principal_investigator")