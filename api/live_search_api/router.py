from collections import defaultdict
from datetime import datetime, timedelta
from json import dumps
from itertools import groupby
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy import and_, select, func
from api.auth.models import User
from api.config.models import (
    ListLrSearchSystem,
    UserQueryCount,
    YandexLr,
    LiveSearchList,
    LiveSearchListQuery,
    Config
)
from api.config.utils import get_config_names, get_group_names
from api.schemas import GetPositionTableData, PositionDayStat
from api.live_search_api.db import get_urls_with_pagination, get_urls_with_pagination_and_like, get_urls_with_pagination_sort, get_urls_with_pagination_sort_and_like
from db.session import get_db_general

from sqlalchemy.ext.asyncio import AsyncSession

from api.auth.auth_config import current_user, PermissionRoleChecker

from const import date_format_2, date_format, query_value


templates = Jinja2Templates(directory="static")


router = APIRouter()

@router.get("/")
async def get_live_search(
    request: Request,
    list_id: int = Query(None),
    search_system: str = Query(None),
    lr_id: int = Query(None),
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_db_general),
    required: bool = Depends(PermissionRoleChecker({"access_live_search"})),
):  
    if lr_id == -1:
        lr_id = (await session.execute(select(ListLrSearchSystem.id).where(and_(ListLrSearchSystem.list_id == list_id, ListLrSearchSystem.search_system == search_system)))).scalars().first()
        if lr_id is None:
            lr_id = -1
    print(lr_id)

    group_name = request.session["group"].get("name", "")
    
    config_names = [elem[0] for elem in (await get_config_names(session, user, group_name))]

    group_names = await get_group_names(session, user)

    query_count = (await session.execute(select(UserQueryCount.query_count).where(UserQueryCount.user_id == user.id))).scalars().first()

    region_list = (await session.execute(select(ListLrSearchSystem).where(and_(ListLrSearchSystem.list_id == list_id, ListLrSearchSystem.search_system == search_system)))).scalars().all()

    regions = (await session.execute(select(YandexLr))).scalars().all()
    region_dict = {region.Geoid: region.Geo for region in regions}

    current_region = (await session.execute(select(ListLrSearchSystem.lr).where(ListLrSearchSystem.id == lr_id))).scalars().first()

    print(current_region)

    return templates.TemplateResponse("live_search-info.html",
                                      {"request": request,
                                       "user": user,
                                       "config_names": config_names,
                                       "group_names": group_names,
                                       "list_id": list_id,
                                       "query_count": query_count,
                                       "search_system": search_system,
                                       "lr_id": lr_id,
                                       "region_list": region_list,
                                       "region_dict": region_dict,
                                       "current_region": current_region,
                                        }
                                       )


@router.get("/all_regions")
async def get_all_regions(
    request: Request,
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_db_general)
):
    regions = (await session.execute(select(YandexLr))).scalars().all()
    return {'data': {region.Geoid: region.Geo for region in sorted(
        regions,
        key=lambda x: x.Geo)}}


@router.get("/{list_id}/table")
async def get_live_search_test(
        request: Request,
        list_id: int,
        user: User = Depends(current_user),
        session: AsyncSession = Depends(get_db_general),
        # required: bool = Depends(PermissionRoleChecker({"access_live_search"})),
):

    group_name = request.session["group"].get("name", "")

    config_names = [elem[0] for elem in (
        await get_config_names(session, user, group_name)
    )]

    group_names = await get_group_names(session, user)

    query_count = (await session.execute(
        select(UserQueryCount.query_count)
        .where(UserQueryCount.user_id == user.id))).scalars().first()

    regions = (
        await session.execute(
            select(
                YandexLr.Geoid,
                YandexLr.Geo,
                ListLrSearchSystem.search_system,
            )
            .join(ListLrSearchSystem, YandexLr.Geoid == ListLrSearchSystem.lr)
            .where(ListLrSearchSystem.list_id == list_id)
            .group_by(
                YandexLr.Geoid,
                YandexLr.Geo,
                ListLrSearchSystem.search_system,
            )
            .order_by(YandexLr.Geo)
        )
    ).mappings().all()
    grouped_regions = defaultdict(list)
    for row in regions:
        grouped_regions[row['search_system']].append({
            'Geoid': row['Geoid'],
            'Geo': row['Geo'],
        })

    return templates.TemplateResponse(
        "templates/live_search/positions_table.html",
        {
            "request": request,
            "user": user,
            "config_names": config_names,
            "group_names": group_names,
            "list_id": list_id,
            "query_count": query_count,
            "region_data": dumps(grouped_regions),
        }
    )


@router.get("/{list_id}/table_data")
async def get_live_search_list_table(
        request: Request,
        list_id: int,
        start_date: int = Query(None),
        end_date: int = Query(None),
        lr_list_id: int = Query(None),
        search_system: str = Query(None),
        button_date: str = Query(None),
        sort_result: bool = Query(False),
        search_text: str = Query(None),
        start: int = Query(0),
        length: int = Query(0),
        sort_desc: bool = Query(False),
        button_state: bool | None = Query(None),
        metric_type: str = Query(None),
        state_type: str = Query(None),
        user: User = Depends(current_user),
        session: AsyncSession = Depends(get_db_general)
) -> list[GetPositionTableData]:
    if lr_list_id is None:
        raise HTTPException(status_code=400, detail="lr_id is None")
    start_date = datetime.fromtimestamp(start_date).strftime(date_format_2)
    end_date = datetime.fromtimestamp(end_date).strftime(date_format_2)

    state_date = None
    if button_date:
        state_date = datetime.strptime(button_date, date_format_2)

    if sort_result:
        if search_text == "":
            urls, all_queries = await get_urls_with_pagination_sort(
                start,
                length,
                start_date,
                end_date,
                sort_desc,
                list_id,
                lr_list_id,
                session,
            )
        else:
            urls, all_queries = await get_urls_with_pagination_sort_and_like(
                start,
                length,
                start_date,
                end_date,
                search_text,
                sort_desc,
                list_id,
                lr_list_id,
                session
            )
    else:
        if search_text == "" or search_text is None:
            urls, all_queries = await get_urls_with_pagination(
                start,
                length,
                start_date,
                end_date,
                button_state,
                state_date,
                metric_type,
                state_type,
                list_id,
                lr_list_id,
                search_system,
                session,
            )
        else:
            urls, all_queries = await get_urls_with_pagination_and_like(
                start,
                length,
                start_date,
                end_date,
                search_text or "",
                button_state,
                state_date,
                metric_type,
                state_type,
                list_id,
                lr_list_id,
                search_system,
                session,
            )
    try:
        if urls:
            urls.sort(key=lambda x: x[-1])

        grouped_data = [(key, sorted(list(group), key=lambda x: x[0])) for key, group in
                        groupby(urls, key=lambda x: x[-1])]

        if button_state:
            if metric_type == "P":
                grouped_data.sort(
                    key=lambda x: next(
                        (
                            sub_item[2] if sub_item[2] != 0 else
                            (-float('inf') if button_state == "decrease" else float('inf'))
                            for sub_item in x[1]
                            if sub_item[0] == state_date
                        ),
                        -float('inf') if button_state == "decrease" else float('inf')
                    ),
                    reverse=button_state == "decrease"
                )
    except TypeError as e:
        return []

    if len(grouped_data) == 0:
        return []

    data = []
    current_query = set()
    for el in grouped_data:
        # res = {"query":
        #            f"<div style='width:355px; height: 55px; overflow: auto; white-space: nowrap;'><span>{el[0]}</span></div>"}
        res = GetPositionTableData(query=el[0], dates=[])
        current_query.add(el[0])
        url, pos = "", float("inf")
        for k, stat in enumerate(el[1]):
            pos = stat[2]
            if stat[2] > 0:
                # res[stat[0].strftime(
                #     date_format_2)] = f"""
                #     <div style='height: 55px; width: 100px; margin: 0px; padding: 0px; background-color: {color}; text-align: center; display: flex; align-items: center; justify-content: center;'>
                #         <a href='{stat[1]}' style='font-size: 18px; text-decoration: none; color: inherit;'>
                #             {stat[2]}
                #         </a>
                #     </div>"""
                res.dates.append(
                    {
                        stat[0].strftime(date_format_2): PositionDayStat(
                            link=stat[1], count=stat[2]
                        )
                    }
                )
            else:
                # res[stat[0].strftime(
                #     date_format_2)] = f"""<div style='height: 55px; width: 100px; margin: 0px; padding: 0px; background-color: #FFFF99; text-align: center; display: flex; align-items: center; justify-content: center;'>
                #                         <span style='font-size: 18px'>-</span></div>"""
                res.dates.append(
                    {
                        stat[0].strftime(date_format_2): PositionDayStat(
                            link=stat[1], count=None
                        )
                    }
                )
        data.append(res)

    for query in all_queries:
        if query not in current_query:
            data.append(GetPositionTableData(query=query, dates=[]))

    return data


@router.post("/{list_id}/table_data/test")
async def get_live_search_table_test(
    request: Request,
    data_request: dict,
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_db_general)
):
    start_date = datetime.strptime(data_request["start_date"], date_format_2)
    end_date = datetime.strptime(data_request["end_date"], date_format_2)
    list_id = int(data_request["list_id"])
    search_system = data_request["search_system"]
    state_date = None
    if data_request["button_date"]:
        state_date = datetime.strptime(data_request["button_date"], date_format_2)

    region_id = (
        int(data_request['region_id']) if data_request['region_id'] else None
    )

    if region_id:
        lr_list_id = (await session.execute(
            select(ListLrSearchSystem.id)
            .where(and_(
                ListLrSearchSystem.list_id == list_id,
                ListLrSearchSystem.lr == region_id
            ))
        )).scalars().first()
    else:
        lr_list_id = (await session.execute(
            select(ListLrSearchSystem.id)
            .where(and_(
                ListLrSearchSystem.list_id == list_id,
            ))
        )).scalars().first()

    if data_request["sort_result"]:
        if data_request["search_text"] == "":
            result_query = await get_urls_with_pagination_sort(
                data_request["start"], 
                data_request["length"], 
                start_date,
                end_date,
                data_request["sort_desc"],
                list_id,
                lr_list_id,
                session,
                )
        else:
            result_query = await get_urls_with_pagination_sort_and_like(
                data_request["start"], 
                data_request["length"],
                start_date, 
                end_date,
                data_request["search_text"],
                data_request["sort_desc"],
                list_id,
                lr_list_id,
                session
                )
    else:
        if data_request["search_text"] == "":
            result_query = await get_urls_with_pagination(
                data_request["start"], 
                data_request["length"], 
                start_date,
                end_date, 
                data_request["button_state"], 
                state_date,
                data_request["metric_type"],
                data_request["state_type"],
                list_id,
                lr_list_id,
                search_system,
                session,
                )
        else:
            result_query = await get_urls_with_pagination_and_like(
                data_request["start"], 
                data_request["length"],
                start_date, 
                end_date, 
                data_request["search_text"],
                data_request["button_state"], 
                state_date,
                data_request["metric_type"],
                data_request["state_type"],
                list_id,
                lr_list_id,
                search_system,
                session,
                )
    try:
        if not result_query:
            raise TypeError('Результат не содержит данных')
        urls, _ = result_query
        urls.sort(key=lambda x: x[-1])

        grouped_data = [(key, sorted(list(group), key=lambda x: x[0])) for key, group in
                        groupby(urls, key=lambda x: x[-1])]

        if data_request["button_state"]:
            if data_request["metric_type"] == "P":
                grouped_data.sort(
                    key=lambda x: next(
                        (
                            sub_item[2] if sub_item[2] != 0 else 
                            (-float('inf') if data_request["button_state"] == "decrease" else float('inf'))
                            for sub_item in x[1]
                            if sub_item[0] == state_date
                        ),
                        -float('inf') if data_request["button_state"] == "decrease" else float('inf')
                    ),
                    reverse=data_request["button_state"] == "decrease"
                )
    except TypeError:
        return HTTPException(status_code=400, detail={"data": []})

    if len(grouped_data) == 0:
        return JSONResponse({"data": []})

    data = []
    current_query = set()
    for el in grouped_data:
        cnt, total_position = 0, 0
        res = {}
        res['result'] = {'title': el[0]}
        current_query.add(el[0])
        pos = 0
        for stat in el[1]:
            if stat[2] < pos:
                color_text = "green"
            elif stat[2] > pos:
                color_text = "red"
            else:
                color_text = "blue"
            res[stat[0].strftime(date_format_2)] = {
                'color': color_text,
                'position': stat[2],
                'delta': stat[2] - pos
            }
            pos = stat[2]
            cnt += 1
            total_position += stat[2]
        res['result']['total'] = round(total_position / cnt, 2)
        data.append(res)

    json_data = jsonable_encoder(data)

    return JSONResponse({"data": json_data})


@router.post("/")
async def get_live_search(
    request: Request,
    data_request: dict,
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_db_general)
    ):
    print(data_request)
    start_date = datetime.strptime(data_request["start_date"], date_format_2)
    end_date = datetime.strptime(data_request["end_date"], date_format_2)
    list_id = int(data_request["list_id"])
    lr_list_id = int(data_request["lr_id"])
    search_system = data_request["search_system"]
    state_date = None
    if data_request["button_date"]:
        state_date = datetime.strptime(data_request["button_date"], date_format_2)

    if data_request["sort_result"]:
        if data_request["search_text"] == "":
            urls, all_queries = await get_urls_with_pagination_sort(
                data_request["start"], 
                data_request["length"], 
                start_date,
                end_date,
                data_request["sort_desc"],
                list_id,
                lr_list_id,
                session,
                )
        else:
            urls, all_queries = await get_urls_with_pagination_sort_and_like(
                data_request["start"], 
                data_request["length"],
                start_date, 
                end_date,
                data_request["search_text"],
                data_request["sort_desc"],
                list_id,
                lr_list_id,
                session
                )
    else:
        if data_request["search_text"] == "":
            urls, all_queries = await get_urls_with_pagination(
                data_request["start"], 
                data_request["length"], 
                start_date,
                end_date, 
                data_request["button_state"], 
                state_date,
                data_request["metric_type"],
                data_request["state_type"],
                list_id,
                lr_list_id,
                search_system,
                session,
                )
        else:
            urls, all_queries = await get_urls_with_pagination_and_like(
                data_request["start"], 
                data_request["length"],
                start_date, 
                end_date, 
                data_request["search_text"],
                data_request["button_state"], 
                state_date,
                data_request["metric_type"],
                data_request["state_type"],
                list_id,
                lr_list_id,
                search_system,
                session,
                )
    try:
        if urls:
            urls.sort(key=lambda x: x[-1])
        
        grouped_data = [(key, sorted(list(group), key=lambda x: x[0])) for key, group in
                        groupby(urls, key=lambda x: x[-1])]

        if data_request["button_state"]:
            if data_request["metric_type"] == "P":
                grouped_data.sort(
                    key=lambda x: next(
                        (
                            sub_item[2] if sub_item[2] != 0 else 
                            (-float('inf') if data_request["button_state"] == "decrease" else float('inf'))
                            for sub_item in x[1]
                            if sub_item[0] == state_date
                        ),
                        -float('inf') if data_request["button_state"] == "decrease" else float('inf')
                    ),
                    reverse=data_request["button_state"] == "decrease"
                )
    except TypeError as e:
        return JSONResponse({"data": []})

    if len(grouped_data) == 0:
        return JSONResponse({"data": []})
    
    data = []
    current_query = set()
    for el in grouped_data:
        res = {"query":
                   f"<div style='width:355px; height: 55px; overflow: auto; white-space: nowrap;'><span>{el[0]}</span></div>"}
        current_query.add(el[0])
        url, pos = "", float("inf")
        for k, stat in enumerate(el[1]):
            if stat[2] < pos:
                color = "#9DE8BD"
                color_text = "green"
            elif stat[2] > pos:
                color = "#FDC4BD"
                color_text = "red"
            else:
                color = "#B4D7ED"
                color_text = "blue"
            pos = stat[2]
            if stat[2] > 0:
                res[stat[0].strftime(
                    date_format_2)] = f"""<div style='height: 55px; width: 100px; margin: 0px; padding: 0px; background-color: {color}; text-align: center; display: flex; align-items: center; justify-content: center;'>
                                        <a href='{stat[1]}' style='font-size: 18px; text-decoration: none; color: inherit;'>
                                            {stat[2]}
                                        </a>
                                    </div>"""
            else:   
                res[stat[0].strftime(
                date_format_2)] = f"""<div style='height: 55px; width: 100px; margin: 0px; padding: 0px; background-color: #FFFF99; text-align: center; display: flex; align-items: center; justify-content: center;'>
                                        <span style='font-size: 18px'>-</span></div>"""
        data.append(res)
    
    for query in all_queries:
        if query not in current_query:
            data.append(
                {"query":
                   f"<div style='width:355px; height: 55px; overflow: auto; white-space: nowrap;'><span>{query}</span></div>"}
                   )

    json_data = jsonable_encoder(data)

    return JSONResponse({"data": json_data})


@router.get("/update_query_count")
async def update_query_count(
    request: Request,
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_db_general)
):
    res = (await session.execute(select(UserQueryCount).where(UserQueryCount.user_id == user.id))).scalars().first()

    if res.last_update_date == datetime.strptime(datetime.now().strftime(date_format), date_format):
        raise HTTPException(status_code=400, detail="Сегодня запросы уже были обновлены")
    
    res.query_count = query_value
    res.last_update_date = datetime.strptime(datetime.now().strftime(date_format), date_format)

    await session.commit()

    return {
        "status": 200,
        "message": f"query for {user.username} reset"
    }


@router.get("/edit_live_search/{list_id}")
async def edit_live_search(
    request: Request,
    list_id: int,
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_db_general),
):
    try:
        live_data = (await session.execute(
            select(LiveSearchList)
            .where(LiveSearchList.id == list_id)
        )).scalar_one_or_none()
        if not live_data:
            raise Exception('Объект не найден')

        live_query = (await session.execute(
           select(LiveSearchListQuery.id, LiveSearchListQuery.query)
           .where(LiveSearchListQuery.list_id == list_id)
        )).all()

        regions = (await session.execute(
            select(
                YandexLr.Geoid,
                YandexLr.Geo,
                ListLrSearchSystem.search_system
            )
            .join(YandexLr, YandexLr.Geoid == ListLrSearchSystem.lr)
            .having(ListLrSearchSystem.list_id == list_id)
            .group_by(
                YandexLr.Geoid,
                YandexLr.Geo,
                ListLrSearchSystem.list_id,
                ListLrSearchSystem.search_system,
            )
        )).all()

    except Exception as e:
        return HTTPException(status_code=500, detail=e)

    return templates.TemplateResponse(
        'templates/live_search/edit.html', {
            'request': request,
            'user': user,
            'live_data': live_data,
            'live_query': live_query,
            'regions': regions
        }
    )


@router.get('/my_projects')
async def get_my_projects(
    request: Request,
    # pagination_data: dict,
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_db_general),
):
    pagination_data = {}
    page: str = pagination_data.get('page', "1")
    page_size: str = pagination_data.get('page_size', "50")

    if not page.isalnum() or not page_size.isalnum():
        return HTTPException(
            status_code=400,
            detail="Данные для пагинации должны быть числами"
        )
    page = int(page)
    page_size = int(page_size)

    live_search_data = (await session.execute(
        select(
            LiveSearchList,
            func.count(LiveSearchListQuery.id).label('query_count')
        )
        .outerjoin(LiveSearchListQuery, LiveSearchList.queries)
        .where(LiveSearchList.author == user.id)
        .group_by(LiveSearchList.id)
    )).all()

    live_search_list = []
    for live_search, query_count in live_search_data:
        setattr(live_search, 'query_count', query_count)
        live_search_list.append(live_search)

    webmaster_data = (await session.execute(
        select(Config)
        .where(Config.id_author == user.id)
    )).scalars().all()

    sorted_data = sorted(
        webmaster_data + live_search_list, key=lambda i: i.name
    )
    start = (page - 1) * page_size
    end = start + page_size
    paginated_data = sorted_data[start:end]

    return templates.TemplateResponse(
        'templates/my_projects/my_projects_list.html', {
            'request': request,
            'user': user,
            'projects': paginated_data,
        }
    )
