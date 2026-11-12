import json

from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_protect
from django.shortcuts import render
from .models import Publication, Project, UIEvent
from .models import Feedback


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



# Week 11：接收網站操作紀錄

@require_POST
@csrf_protect
def receive_event(request):
    try:
        event = json.loads(request.body)

        if not isinstance(event, dict):
            return JsonResponse({
                "success": False,
                "message": "資料格式錯誤"
            }, status=400)

        # 檢查必要欄位
        required_fields = [
            "event_id",
            "session_id",
            "seq",
            "event_type",
            "page_id",
            "occurred_at"
        ]

        if any(event.get(field) is None for field in required_fields):
            return JsonResponse({
                "success": False,
                "message": "缺少必要欄位"
            }, status=400)

        # 將操作紀錄寫入資料庫
        record = UIEvent.objects.create(
            event_id=event["event_id"],
            session_id=event["session_id"],
            seq=event["seq"],
            event_type=event["event_type"],
            page_id=event["page_id"],
            target_id=event.get("target_id") or "",
            occurred_at=event["occurred_at"],
            ui_version=event.get("ui_version") or "",
            test_phase=event.get("test_phase") or "",
            data=event.get("data") or {}
        )

        return JsonResponse({
            "success": True,
            "message": "操作紀錄已儲存",
            "id": record.id
        })

    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({
            "success": False,
            "message": "JSON 格式錯誤"
        }, status=400)



# 接收按讚、倒讚與意見回饋
@require_POST
@csrf_protect
def receive_feedback(request):
    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({
            "success": False,
            "message": "JSON 格式錯誤"
        }, status=400)

    if not isinstance(data, dict):
        return JsonResponse({
            "success": False,
            "message": "資料格式錯誤"
        }, status=400)

    page_id = data.get("page_id")
    rating = data.get("rating")
    comment = data.get("comment")

    if page_id not in ("home", "publications", "projects"):
        return JsonResponse({
            "success": False,
            "message": "頁面識別碼錯誤"
        }, status=400)

    if rating not in ("like", "dislike"):
        return JsonResponse({
            "success": False,
            "message": "請選擇按讚或倒讚"
        }, status=400)

    if not isinstance(comment, str) or not comment.strip():
        return JsonResponse({
            "success": False,
            "message": "請填寫意見"
        }, status=400)

    if len(comment.strip()) > 2000:
        return JsonResponse({
            "success": False,
            "message": "意見不可超過 2000 字"
        }, status=400)

    record = Feedback.objects.create(
        page_id=page_id,
        rating=rating,
        comment=comment.strip()
    )

    return JsonResponse({
        "success": True,
        "message": "感謝你的回饋，意見已儲存！",
        "id": record.id
    })