
from django.shortcuts import render
from .models import Publication, Project


# 首頁
def home(request):
    return render(request, "index.html")


# 學術論著
def publication_list(request):
    publications = Publication.objects.all()

    return render(
        request,
        "publications.html",
        {"publications": publications}
    )


# 主持計畫
def project_list(request):
    projects = Project.objects.all()
    

    print("主持計畫數量：", projects.count())

    return render(
        request,
        "projects.html",
        {"projects": projects}
    )
