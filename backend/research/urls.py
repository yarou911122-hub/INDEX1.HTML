
from django.urls import path
from . import views

urlpatterns = [
    path("", views.home, name="home"),
    path(
        "publications/",
        views.publication_list,
        name="publication_list"
    ),
    path(
        "projects/",
        views.project_list,
        name="project_list"
    ),
]
