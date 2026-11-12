
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


 # Week 11：接收使用者操作紀錄
    path(
        "api/events/",
        views.receive_event,
        name="receive_event"
    ),


path("api/feedback/", 
     views.receive_feedback, 
     name="receive_feedback"
     ),

     ]
