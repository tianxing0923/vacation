import moment from 'moment'

export interface UserProps {
  id: string
  name: string
  entrydate: moment.Moment
  workdate: moment.Moment
}

export interface AnnualLeaveProps {
  year: number
  days: number
}

export interface UserAnnualLeaveProps extends UserProps {
  annuals: AnnualLeaveProps[]
}

/**
 * 获取员工年假列表
 *
 * @export
 * @param {UserProps[]} users - 员工信息列表
 * @returns
 */
export function getAnnualLeaveList(users: UserProps[]) {
  var halList: UserAnnualLeaveProps[] = []
  users.forEach((user) => {
    let now = moment()
    let nowYear = now.year()
    let annuals: AnnualLeaveProps[] = []
    let el = JSON.parse(JSON.stringify(user))
    el.entrydate = moment(el.entrydate)
    el.workdate = moment(el.workdate)

    // 从2018年开始按年循环遍历年假
    for (let year = 2018; year <= nowYear; year++) {
      let start = year < nowYear ? moment(year + '/12/31') : now
      let days = calcYearAnnualLeave(el, start)
      annuals.push({
        year,
        days,
      })
    }

    halList.push({
      ...user,
      annuals,
    })
  })
  return halList
}

/**
 * 计算用户当年的实际年假天数
 *
 * @param {UserProps} user - 员工信息
 * @param {moment.Moment} dt - 截止日期
 * @returns
 */
function calcYearAnnualLeave(user: UserProps, dt: moment.Moment) {
  if (user == null || user.entrydate > dt) {
    return 0
  }
  if (!user.entrydate.isValid() || !user.workdate.isValid()) {
    return 0
  }

  let companyDays = calcCompanyDays(user, dt) // 司龄假
  let baseDays = calcWorkDays(user, dt) // 当年工龄假基数 [0、5、10、15]天

  // 工作不满一年
  if (baseDays === 0) {
    return 0
  }

  let tenOrTwentyYear = null // 工龄满10年或20年年份
  if (baseDays >= 10) {
    let t = baseDays == 10 ? 10 : baseDays == 15 ? 20 : 0
    tenOrTwentyYear = user.workdate.year() + t
  }

  let before = 0 // 入职日期分界线前半部分
  let after = 0 // 入职日期分界线后半部分

  let dtYear = dt.year()

  // 当年刚好满10年或20年
  if (dtYear === tenOrTwentyYear) {
    // 满10年或20年的分界线
    let tenOrTwentyDate = moment([dtYear, user.workdate.month(), user.workdate.date()])

    // 入职当年
    if (dtYear === user.entrydate.year()) {
      // 刚好是满10年或20年
      if (tenOrTwentyDate >= user.entrydate) {
        before = tenOrTwentyDate.diff(user.entrydate, 'days') / 365
        after = (dt.diff(tenOrTwentyDate, 'days') + 1) / 365
      } else {
        after = (dt.diff(user.entrydate, 'days') + 1) / 365
      }
    } else {
      before = tenOrTwentyDate.diff(moment([dtYear, 0, 1]), 'days') / 365
      after = (dt.diff(tenOrTwentyDate, 'days') + 1) / 365
    }
  } else if (dtYear >= user.entrydate.year()) {
    if (dtYear === user.entrydate.year()) {
      after = (dt.diff(user.entrydate, 'days') + 1) / 365
    } else {
      after = (dt.diff(moment([dtYear, 0, 1]), 'days') + 1) / 365
    }
  }

  let days = (baseDays - 5) * before + baseDays * after
  let total = days + companyDays
  return total > 15 ? 15 : total
}

/**
 * 获取司龄假天数，向下取整
 *
 * @param {UserProps} user - 员工信息
 * @param {moment.Moment} dt - 截止日期
 * @returns
 */
function calcCompanyDays(user: UserProps, dt: moment.Moment) {
  if (user == null) {
    return 0
  }
  let year = Math.floor(dt.diff(user.entrydate, 'days') / 365)
  return year
}

/**
 * 获取工龄假天数
 *
 * @param {UserProps} user - 员工信息
 * @param {moment.Moment} dt - 截止日期
 * @returns
 */
function calcWorkDays(user: UserProps, dt: moment.Moment) {
  if (user == null) {
    return 0
  }
  if (!user.workdate.isValid()) {
    return 0
  }

  let diff = dt.diff(user.workdate, 'years', true)
  if (diff >= 1 && diff < 10) {
    return 5
  } else if (diff >= 10 && diff < 20) {
    return 10
  } else if (diff >= 20) {
    return 15
  }

  return 0
}

/**
 * 满0.5天不满1天算0.5天，不满0.5天算0天
 *
 * @export
 * @param {number} days - 天数
 * @returns
 */
export function calcHalfDays(days: number) {
  return days % 1 < 0.5 ? Math.floor(days) : Math.floor(days) + 0.5
}
