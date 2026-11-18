
from django.contrib import admin
from .models import Publication, Project, UIEvent, Feedback

from django.urls import path
from .views import dashboard



# 學術論著
@admin.register(Publication)
class PublicationAdmin(admin.ModelAdmin):
    list_display = ("title", "authors", "year", "publication_type")
    list_filter = ("year", "publication_type")
    search_fields = ("title", "authors")


# 主持計畫
@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "principal_investigator",
        "start_year",
        "end_year",
    )
    list_filter = ("start_year",)
    search_fields = ("title", "principal_investigator")


# 使用者行為紀錄
@admin.register(UIEvent)
class UIEventAdmin(admin.ModelAdmin):
    list_display = (
        "event_type",
        "page_id",
        "target_id",
        "occurred_at",
        "session_id",
    )

    list_filter = (
        "event_type",
        "page_id",
        "occurred_at",
    )

    search_fields = (
        "event_id",
        "session_id",
        "target_id",
    )

    ordering = ("-occurred_at",)
    readonly_fields = [f.name for f in UIEvent._meta.fields]

    # 不允許管理員新增或修改原始行為紀錄
    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


# 使用者回饋
@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "page_id",
        "rating",
        "comment",
        "created_at",
    )

    list_filter = (
        "page_id",
        "rating",
        "created_at",
    )

    search_fields = (
        "comment",
        "page_id",
    )

    ordering = ("-created_at",)
    readonly_fields = [f.name for f in Feedback._meta.fields]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False



# 將 Dashboard 加入 Django Admin
original_get_urls = admin.site.get_urls

def get_admin_urls():
    custom_urls = [
        path(
            "dashboard/",
            admin.site.admin_view(dashboard),
            name="dashboard",
        ),
    ]
    return custom_urls + original_get_urls()

admin.site.get_urls = get_admin_urls
